"""Firecrawl API extraction strategy — Tier 3 fallback.

Uses Firecrawl's scrape endpoint to get markdown content.
Requires FIRECRAWL_API_KEY environment variable.
Budget: ~$0.001 per page on Hobby plan (3K credits/mo).
"""

import logging
import os

import httpx

from src.extractor.strategies.base import ExtractionStrategy

logger = logging.getLogger(__name__)

FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape"


class FirecrawlStrategy(ExtractionStrategy):
    """Extract content using Firecrawl API."""

    name = "firecrawl"

    def __init__(self):
        self._api_key = os.getenv("FIRECRAWL_API_KEY", "")

    @property
    def available(self) -> bool:
        """Check if Firecrawl API key is configured."""
        return bool(self._api_key)

    async def extract(self, url: str, timeout: int = 30) -> dict | None:
        """Extract content via Firecrawl API.

        Returns dict with: html, text (markdown), title, author, published_at
        """
        if not self.available:
            logger.debug("Firecrawl API key not set, skipping")
            return None

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    FIRECRAWL_API_URL,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "url": url,
                        "formats": ["markdown", "html"],
                    },
                )

                if resp.status_code == 429:
                    logger.warning("Firecrawl rate limited for %s", url)
                    return None

                if resp.status_code == 402:
                    logger.warning("Firecrawl credit limit reached")
                    return None

                if resp.status_code != 200:
                    logger.warning(
                        "Firecrawl returned %d for %s: %s",
                        resp.status_code,
                        url,
                        resp.text[:200],
                    )
                    return None

                data = resp.json()

                if not data.get("success"):
                    logger.warning("Firecrawl extraction failed for %s", url)
                    return None

                result_data = data.get("data", {})
                metadata = result_data.get("metadata", {})

                return {
                    "html": result_data.get("html", ""),
                    "text": result_data.get("markdown", ""),
                    "title": metadata.get("title") or metadata.get("ogTitle", ""),
                    "author": metadata.get("author", ""),
                    "published_at": metadata.get("publishedTime"),
                }
        except httpx.TimeoutException:
            logger.warning("Firecrawl timeout for %s", url)
            return None
        except Exception as exc:
            logger.warning("Firecrawl error for %s: %s", url, exc)
            return None
