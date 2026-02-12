"""Article content crawler using Crawl4AI with BeautifulSoup fallback."""

import asyncio
import logging
import re
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

logger = logging.getLogger(__name__)

_HEADERS = {"User-Agent": "TechBlogCatchup/1.0"}
_TIMEOUT = 30


def _parse_date(date_str: str | None) -> datetime | None:
    """Try to parse a date string from metadata into a datetime object."""
    if not date_str:
        return None

    # Common date formats found in article metadata
    formats = [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%B %d, %Y",
        "%b %d, %Y",
    ]
    date_str = date_str.strip()
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    logger.debug("Could not parse date: %s", date_str)
    return None


def _extract_title_from_markdown(markdown: str) -> str | None:
    """Extract the first H1 heading from markdown as a fallback title."""
    for line in markdown.split("\n"):
        line = line.strip()
        if line.startswith("# ") and not line.startswith("## "):
            return line.lstrip("# ").strip()
    return None


def _fallback_crawl(url: str) -> dict | None:
    """Simple requests + BeautifulSoup fallback when Crawl4AI fails."""
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Fallback fetch failed for %s: %s", url, exc)
        return None

    soup = BeautifulSoup(resp.text, "lxml")

    # Title
    title = None
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"]
    elif soup.title and soup.title.string:
        title = soup.title.string.strip()
    elif soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)

    if not title:
        title = url  # last resort

    # Author
    author = None
    meta_author = soup.find("meta", attrs={"name": "author"})
    if meta_author and meta_author.get("content"):
        author = meta_author["content"]

    # Published date
    published_at = None
    for attr in ("article:published_time", "datePublished", "og:article:published_time"):
        meta = soup.find("meta", property=attr) or soup.find("meta", attrs={"name": attr})
        if meta and meta.get("content"):
            published_at = _parse_date(meta["content"])
            if published_at:
                break

    # Also check <time> elements
    if not published_at:
        time_el = soup.find("time", attrs={"datetime": True})
        if time_el:
            published_at = _parse_date(time_el["datetime"])

    # Article body text
    # Try <article> tag first, then fall back to the whole body
    article_el = soup.find("article")
    if article_el:
        text = article_el.get_text(separator="\n", strip=True)
    else:
        # Remove nav, header, footer, aside, script, style
        for tag_name in ("nav", "header", "footer", "aside", "script", "style", "noscript"):
            for tag in soup.find_all(tag_name):
                tag.decompose()
        body = soup.find("body")
        text = body.get_text(separator="\n", strip=True) if body else ""

    if not text:
        return None

    word_count = len(text.split())

    return {
        "url": url,
        "title": title,
        "text": text,
        "author": author,
        "published_at": published_at,
        "word_count": word_count,
    }


async def crawl_article(url: str) -> dict | None:
    """Crawl a single article URL and return extracted content.

    Uses Crawl4AI's AsyncWebCrawler for rich extraction. Falls back to
    requests + BeautifulSoup if Crawl4AI fails.

    Returns a dict with keys: url, title, text, author, published_at, word_count.
    Returns None if extraction fails entirely.
    """
    try:
        async with AsyncWebCrawler(config=BrowserConfig(headless=True)) as crawler:
            result = await crawler.arun(url=url, config=CrawlerRunConfig())

            if not result or not result.success:
                logger.warning("Crawl4AI returned unsuccessful result for %s, trying fallback", url)
                return _fallback_crawl(url)

            markdown = result.markdown or ""
            metadata = result.metadata or {}

            if not markdown.strip():
                logger.warning("Crawl4AI returned empty markdown for %s, trying fallback", url)
                return _fallback_crawl(url)

            # Title extraction
            title = metadata.get("title") or metadata.get("og:title")
            if not title:
                title = _extract_title_from_markdown(markdown)
            if not title:
                title = url

            # Author extraction
            author = metadata.get("author") or metadata.get("article:author")
            if not author:
                # Try common meta patterns in metadata dict
                for key in metadata:
                    if "author" in key.lower():
                        candidate = metadata[key]
                        if isinstance(candidate, str) and candidate.strip():
                            author = candidate.strip()
                            break

            # Published date extraction
            published_at = None
            for key in ("article:published_time", "datePublished", "og:article:published_time", "date", "published_time"):
                val = metadata.get(key)
                if val:
                    published_at = _parse_date(val)
                    if published_at:
                        break

            # Use the markdown as text
            text = markdown.strip()
            word_count = len(text.split())

            return {
                "url": url,
                "title": title,
                "text": text,
                "author": author,
                "published_at": published_at,
                "word_count": word_count,
            }

    except Exception as exc:
        logger.warning("Crawl4AI error for %s: %s — trying fallback", url, exc)
        return _fallback_crawl(url)


async def crawl_articles_batch(urls: list[str], delay: float = 1.5) -> list[dict]:
    """Crawl multiple article URLs sequentially with a delay between each.

    Args:
        urls: List of article URLs to crawl.
        delay: Seconds to wait between requests (default 1.5).

    Returns:
        List of successfully crawled result dicts. Failed URLs are skipped.
    """
    results: list[dict] = []

    for i, url in enumerate(urls):
        logger.info("Crawling article %d/%d: %s", i + 1, len(urls), url)
        try:
            article = await crawl_article(url)
            if article is not None:
                results.append(article)
                logger.info("  -> OK: %s (%d words)", article["title"][:80], article["word_count"])
            else:
                logger.warning("  -> SKIP (no content): %s", url)
        except Exception as exc:
            logger.error("  -> ERROR crawling %s: %s", url, exc)

        # Delay between requests (skip after the last one)
        if i < len(urls) - 1 and delay > 0:
            await asyncio.sleep(delay)

    logger.info("Batch crawl complete: %d/%d succeeded", len(results), len(urls))
    return results
