"""Jina Reader extraction strategy — Tier 4 fallback (free, no API key).

Uses r.jina.ai to get clean markdown from any URL.
Free tier with generous limits.
"""

import logging

import httpx

from src.extractor.strategies.base import ExtractionStrategy

logger = logging.getLogger(__name__)

JINA_READER_URL = "https://r.jina.ai"


class JinaStrategy(ExtractionStrategy):
    """Extract content using Jina Reader (free tier)."""

    name = "jina"

    async def extract(self, url: str, timeout: int = 30) -> dict | None:
        """Extract content via Jina Reader API.

        Returns dict with: text (markdown), title
        """
        try:
            reader_url = f"{JINA_READER_URL}/{url}"

            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(
                    reader_url,
                    headers={
                        "Accept": "application/json",
                        "X-Return-Format": "markdown",
                    },
                )

                if resp.status_code != 200:
                    logger.warning(
                        "Jina Reader returned %d for %s",
                        resp.status_code,
                        url,
                    )
                    return None

                # Jina returns JSON with data.content (markdown) and data.title
                data = resp.json()
                content_data = data.get("data", {})

                markdown = content_data.get("content", "")
                title = content_data.get("title", "")

                if not markdown or len(markdown.strip()) < 100:
                    logger.warning("Jina Reader returned too little content for %s", url)
                    return None

                return {
                    "html": "",
                    "text": markdown,
                    "title": title,
                    "author": None,
                    "published_at": None,
                }
        except httpx.TimeoutException:
            logger.warning("Jina Reader timeout for %s", url)
            return None
        except Exception as exc:
            logger.warning("Jina Reader error for %s: %s", url, exc)
            return None
