"""Compatibility name: extraction uses fetched source HTML, never model reconstruction."""

from src.extractor.strategies.base import ExtractionStrategy
from src.extractor.safe_fetch import fetch_article
from bs4 import BeautifulSoup
import trafilatura


class LLMStrategy(ExtractionStrategy):
    name = "source_html"

    async def extract(self, url: str, timeout: int = 30) -> dict | None:
        html = await fetch_article(url, timeout)
        text = trafilatura.extract(html, output_format="markdown", include_tables=True)
        if not text:
            return None
        soup = BeautifulSoup(html, "lxml")
        return {
            "html": "",
            "text": text,
            "title": soup.title.get_text() if soup.title else None,
            "author": None,
            "published_at": None,
        }
