import asyncio
import logging
from datetime import datetime

import requests
from bs4 import BeautifulSoup

from src.extractor.strategies.base import ExtractionStrategy

logger = logging.getLogger(__name__)

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def _parse_date(date_str: str | None) -> datetime | None:
    if not date_str:
        return None
    formats = [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None


class BS4Strategy(ExtractionStrategy):
    """Last-resort fallback using requests + BeautifulSoup."""

    name: str = "bs4"

    async def extract(self, url: str, timeout: int = 30) -> dict | None:
        """Extract content using requests + BeautifulSoup.

        Runs the blocking HTTP call and parsing in a thread pool.
        """
        try:
            return await asyncio.to_thread(self._extract_sync, url, timeout)
        except Exception:
            logger.exception("bs4 extraction failed for %s", url)
            return None

    def _extract_sync(self, url: str, timeout: int) -> dict | None:
        resp = requests.get(
            url,
            headers={"User-Agent": _USER_AGENT},
            timeout=timeout,
        )
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")

        title = self._extract_title(soup)
        author = self._extract_author(soup)
        published_at = self._extract_published_at(soup)
        html, text = self._extract_body(soup)

        if not html and not text:
            logger.warning("bs4 extracted no content from %s", url)
            return None

        return {
            "html": html,
            "text": text,
            "title": title,
            "author": author,
            "published_at": published_at,
        }

    def _extract_title(self, soup: BeautifulSoup) -> str | None:
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"].strip()

        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            return title_tag.string.strip()

        h1 = soup.find("h1")
        if h1:
            return h1.get_text(strip=True)

        return None

    def _extract_author(self, soup: BeautifulSoup) -> str | None:
        meta_author = soup.find("meta", attrs={"name": "author"})
        if meta_author and meta_author.get("content"):
            return meta_author["content"].strip()
        return None

    def _extract_published_at(self, soup: BeautifulSoup) -> datetime | None:
        meta_date = soup.find("meta", property="article:published_time")
        if meta_date and meta_date.get("content"):
            return _parse_date(meta_date["content"])

        time_tag = soup.find("time", attrs={"datetime": True})
        if time_tag:
            return _parse_date(time_tag["datetime"])

        return None

    def _extract_body(self, soup: BeautifulSoup) -> tuple[str, str]:
        """Extract body HTML and plain text.

        Tries <article> first, then falls back to <body> with noise removed.
        """
        article = soup.find("article")
        if article:
            return str(article), article.get_text(separator="\n", strip=True)

        body = soup.find("body")
        if not body:
            return "", ""

        for tag_name in ["nav", "header", "footer", "aside", "script", "style"]:
            for element in body.find_all(tag_name):
                element.decompose()

        return str(body), body.get_text(separator="\n", strip=True)
