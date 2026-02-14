"""Auto-discover RSS/Atom feed URLs for a blog homepage."""

import logging
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

COMMON_FEED_PATHS = [
    "/feed",
    "/feed/",
    "/rss",
    "/rss/",
    "/atom.xml",
    "/feed.xml",
    "/rss.xml",
    "/blog/feed",
    "/blog/feed/",
    "/blog/rss",
    "/blog/rss/",
    "/blog.atom",
    "/blog/atom.xml",
    "/index.xml",
]

FEED_CONTENT_TYPES = {
    "application/rss+xml",
    "application/atom+xml",
    "application/xml",
    "text/xml",
    "application/rdf+xml",
}


async def discover_feeds(blog_url: str, timeout: int = 15) -> list[dict]:
    """Discover RSS/Atom feed URLs for a blog.

    Tries three strategies in order:
    1. Parse HTML <link rel="alternate"> tags
    2. Probe common feed paths with HTTP HEAD
    3. Check for sitemap.xml

    Args:
        blog_url: Blog homepage URL.
        timeout: Request timeout in seconds.

    Returns:
        List of dicts: [{"url": ..., "title": ..., "type": ..., "method": ...}]
        sorted by confidence (HTML discovery first, then probed paths).
    """
    feeds: list[dict] = []
    seen_urls: set[str] = set()

    async with httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=True,
        headers={"User-Agent": "TechBlogCatchup/1.0 FeedDiscovery"},
    ) as client:
        # Strategy 1: Parse HTML for <link rel="alternate"> tags
        html_feeds = await _discover_from_html(client, blog_url)
        for feed in html_feeds:
            if feed["url"] not in seen_urls:
                seen_urls.add(feed["url"])
                feeds.append(feed)

        # Strategy 2: Probe common feed paths
        probed_feeds = await _probe_common_paths(client, blog_url)
        for feed in probed_feeds:
            if feed["url"] not in seen_urls:
                seen_urls.add(feed["url"])
                feeds.append(feed)

    logger.info("Discovered %d feeds for %s", len(feeds), blog_url)
    return feeds


async def _discover_from_html(client: httpx.AsyncClient, blog_url: str) -> list[dict]:
    """Parse HTML page for feed link tags."""
    feeds = []
    try:
        resp = await client.get(blog_url)
        if resp.status_code != 200:
            return feeds

        soup = BeautifulSoup(resp.text, "lxml")

        for link in soup.find_all("link", rel="alternate"):
            link_type = (link.get("type") or "").lower()
            href = link.get("href")
            if not href:
                continue

            if link_type in FEED_CONTENT_TYPES or "rss" in link_type or "atom" in link_type:
                feed_url = urljoin(blog_url, href)
                feeds.append({
                    "url": feed_url,
                    "title": link.get("title", ""),
                    "type": link_type,
                    "method": "html_link",
                })
    except Exception as exc:
        logger.warning("Failed to parse HTML for feeds at %s: %s", blog_url, exc)

    return feeds


async def _probe_common_paths(client: httpx.AsyncClient, blog_url: str) -> list[dict]:
    """Try common feed paths and verify with HEAD request."""
    feeds = []
    parsed = urlparse(blog_url)
    base = f"{parsed.scheme}://{parsed.netloc}"

    for path in COMMON_FEED_PATHS:
        feed_url = urljoin(base, path)
        try:
            resp = await client.head(feed_url)
            if resp.status_code == 200:
                content_type = (resp.headers.get("content-type") or "").lower()
                if any(ct in content_type for ct in ("xml", "rss", "atom")):
                    feeds.append({
                        "url": feed_url,
                        "title": "",
                        "type": content_type.split(";")[0].strip(),
                        "method": "path_probe",
                    })
        except Exception:
            continue

    return feeds


async def find_best_feed(blog_url: str, timeout: int = 15) -> str | None:
    """Convenience: return the single best feed URL or None."""
    feeds = await discover_feeds(blog_url, timeout=timeout)
    if feeds:
        # Prefer html_link discoveries over probed paths
        html_feeds = [f for f in feeds if f["method"] == "html_link"]
        return html_feeds[0]["url"] if html_feeds else feeds[0]["url"]
    return None
