"""Sitemap and Medium archive URL extraction."""

import logging
import xml.etree.ElementTree as ET

import requests

logger = logging.getLogger(__name__)

_HEADERS = {"User-Agent": "TechBlogCatchup/1.0"}
_TIMEOUT = 30

# Common XML namespace for sitemaps
_SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def _fetch(url: str) -> requests.Response | None:
    """Fetch a URL with standard headers and timeout. Return None on failure."""
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=_TIMEOUT)
        resp.raise_for_status()
        return resp
    except requests.RequestException as exc:
        logger.warning("Failed to fetch %s: %s", url, exc)
        return None


def _extract_urls_from_sitemap_xml(content: bytes, url_pattern: str | None) -> list[str]:
    """Parse a single sitemap XML and return matching <loc> URLs."""
    urls: list[str] = []
    try:
        root = ET.fromstring(content)
    except ET.ParseError as exc:
        logger.warning("XML parse error: %s", exc)
        return urls

    # Handle both namespaced and non-namespaced sitemaps
    # Try namespaced first
    locs = root.findall(".//sm:url/sm:loc", _SITEMAP_NS)
    if not locs:
        # Try without namespace
        locs = root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    if not locs:
        # Try completely bare (no namespace)
        locs = root.findall(".//url/loc")

    for loc in locs:
        if loc.text:
            url = loc.text.strip()
            if url_pattern is None or url_pattern in url:
                urls.append(url)

    return urls


def _extract_child_sitemaps(content: bytes) -> list[str]:
    """Extract child sitemap URLs from a sitemap index file."""
    sitemaps: list[str] = []
    try:
        root = ET.fromstring(content)
    except ET.ParseError:
        return sitemaps

    # Check if this is a sitemap index
    # Namespaced
    locs = root.findall(".//sm:sitemap/sm:loc", _SITEMAP_NS)
    if not locs:
        locs = root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}sitemap/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    if not locs:
        locs = root.findall(".//sitemap/loc")

    for loc in locs:
        if loc.text:
            sitemaps.append(loc.text.strip())

    return sitemaps


def _is_sitemap_index(content: bytes) -> bool:
    """Check whether the XML is a sitemapindex (as opposed to a urlset)."""
    try:
        root = ET.fromstring(content)
    except ET.ParseError:
        return False
    tag = root.tag.lower()
    return "sitemapindex" in tag


def parse_sitemap(sitemap_url: str, url_pattern: str | None = None) -> list[str]:
    """Fetch sitemap.xml and return blog post URLs.

    Handles sitemap index files that point to multiple child sitemaps.
    If url_pattern is given, only URLs containing that substring are returned.
    Returns an empty list on any network or parse error.
    """
    resp = _fetch(sitemap_url)
    if resp is None:
        return []

    content = resp.content
    all_urls: list[str] = []

    if _is_sitemap_index(content):
        # This is a sitemap index — recurse into each child sitemap
        child_sitemaps = _extract_child_sitemaps(content)
        logger.info(
            "Sitemap index at %s contains %d child sitemaps", sitemap_url, len(child_sitemaps)
        )
        for child_url in child_sitemaps:
            child_resp = _fetch(child_url)
            if child_resp is None:
                continue
            # Child sitemaps could themselves be indexes (rare but possible)
            if _is_sitemap_index(child_resp.content):
                nested = _extract_child_sitemaps(child_resp.content)
                for nested_url in nested:
                    nested_resp = _fetch(nested_url)
                    if nested_resp is not None:
                        all_urls.extend(
                            _extract_urls_from_sitemap_xml(nested_resp.content, url_pattern)
                        )
            else:
                all_urls.extend(
                    _extract_urls_from_sitemap_xml(child_resp.content, url_pattern)
                )
    else:
        # Direct urlset sitemap
        all_urls = _extract_urls_from_sitemap_xml(content, url_pattern)

    # Deduplicate URLs (sitemaps often have duplicates across child sitemaps)
    seen: set[str] = set()
    deduped: list[str] = []
    for url in all_urls:
        normalized = url.rstrip("/")
        if normalized not in seen:
            seen.add(normalized)
            deduped.append(url)
    if len(deduped) < len(all_urls):
        logger.info("Sitemap dedup: %d -> %d URLs", len(all_urls), len(deduped))

    logger.info("Parsed sitemap %s — found %d URLs", sitemap_url, len(deduped))
    return deduped


def scrape_medium_archive_urls(base_url: str) -> list[str]:
    """Scrape Medium archive pages year-by-year using Crawl4AI browser rendering.

    Medium archive pages are JS-heavy, so we use a headless browser to render
    ``{base_url}/archive/{year}`` for each year from 2015 to the current year.

    Skips non-article pages (archive, tagged, about, etc.) and deduplicates.

    Args:
        base_url: The Medium publication base URL, e.g.
                  ``https://netflixtechblog.medium.com`` or
                  ``https://medium.com/airbnb-engineering``.

    Returns:
        Deduplicated list of article URLs discovered across all years.
    """
    import asyncio
    from datetime import datetime
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

    base_url = base_url.rstrip("/")
    # Strip trailing /archive if the caller passed the old archive_url
    if base_url.endswith("/archive"):
        base_url = base_url[: -len("/archive")]

    current_year = datetime.utcnow().year
    years = list(range(2015, current_year + 1))

    skip_segments = (
        "/archive", "/tagged/", "/about", "/followers",
        "/following", "/latest", "/search",
    )
    domain = base_url.split("/")[2]  # e.g. netflixtechblog.medium.com

    seen: set[str] = set()
    all_urls: list[str] = []

    scroll_js = """
    (async () => {
        let prev = 0;
        for (let i = 0; i < 15; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, 2000));
            if (document.body.scrollHeight === prev) break;
            prev = document.body.scrollHeight;
        }
    })();
    """

    async def _scrape_all_years():
        async with AsyncWebCrawler(config=BrowserConfig(headless=True)) as crawler:
            for year in years:
                archive_url = f"{base_url}/archive/{year}"
                logger.info("Scraping Medium archive: %s", archive_url)
                try:
                    result = await crawler.arun(
                        url=archive_url,
                        config=CrawlerRunConfig(js_code=scroll_js, wait_until="networkidle"),
                    )
                    if not result or not result.success or not result.markdown:
                        logger.warning("No content from %s", archive_url)
                        continue

                    # Extract URLs from the rendered markdown
                    import re as _re
                    raw_links = _re.findall(r'https?://[^\s\)>\]"\']+', result.markdown)

                    for href in raw_links:
                        href = href.rstrip("/").rstrip(".")

                        if any(seg in href for seg in skip_segments):
                            continue

                        # Must be on the same Medium domain
                        if domain not in href and "medium.com" not in href:
                            continue

                        # Article paths have at least 5 parts: https://domain/pub/slug
                        parts = href.rstrip("/").split("/")
                        if len(parts) < 5:
                            continue

                        if href not in seen:
                            seen.add(href)
                            all_urls.append(href)

                except Exception as exc:
                    logger.warning("Failed to scrape %s: %s", archive_url, exc)

                # Polite delay between years
                await asyncio.sleep(2)

    asyncio.run(_scrape_all_years())
    logger.info("Medium archive scrape for %s — found %d article URLs", base_url, len(all_urls))
    return all_urls
