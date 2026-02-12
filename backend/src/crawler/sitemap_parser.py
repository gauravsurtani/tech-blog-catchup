"""Sitemap and Medium archive URL extraction."""

import logging
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

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

    logger.info("Parsed sitemap %s — found %d URLs", sitemap_url, len(all_urls))
    return all_urls


def parse_medium_archive(archive_url: str) -> list[str]:
    """Fetch a Medium /archive page and extract article URLs.

    Medium archive pages list articles as links. We look for <a> tags whose
    href points to a Medium article (contains a 12-hex-char ID suffix pattern).

    Returns an empty list on any network or parse error.
    """
    resp = _fetch(archive_url)
    if resp is None:
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    urls: list[str] = []
    seen: set[str] = set()

    for a_tag in soup.find_all("a", href=True):
        href: str = a_tag["href"]

        # Normalise protocol-relative URLs
        if href.startswith("//"):
            href = "https:" + href

        # Skip non-http links and anchors
        if not href.startswith("http"):
            continue

        # Medium article URLs typically contain a hex ID at the end (e.g. -a1b2c3d4e5f6)
        # They also live under the publication path.  Accept anything that looks
        # like a medium.com article link and isn't a tag/archive/about page.
        skip_segments = ("/archive", "/tagged/", "/about", "/followers", "/following", "/latest")
        if any(seg in href for seg in skip_segments):
            continue

        # Must be on medium.com or a custom Medium domain
        if "medium.com" in href or archive_url.split("/")[2] in href:
            # Rough heuristic: article paths have at least one path component after the pub
            parts = href.rstrip("/").split("/")
            if len(parts) >= 5:  # https://medium.com/pub/article-slug-id
                if href not in seen:
                    seen.add(href)
                    urls.append(href)

    logger.info("Parsed Medium archive %s — found %d article URLs", archive_url, len(urls))
    return urls
