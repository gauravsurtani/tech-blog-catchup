import asyncio
import logging

import trafilatura

from src.extractor.strategies.base import ExtractionStrategy

logger = logging.getLogger(__name__)


class TrafilaturaStrategy(ExtractionStrategy):
    """Primary extraction strategy using trafilatura (F1=0.958)."""

    name: str = "trafilatura"

    async def extract(self, url: str, timeout: int = 30) -> dict | None:
        """Extract content using trafilatura.

        Runs the blocking trafilatura calls in a thread pool.
        """
        try:
            return await asyncio.to_thread(self._extract_sync, url, timeout)
        except Exception:
            logger.exception("trafilatura extraction failed for %s", url)
            return None

    def _extract_sync(self, url: str, timeout: int) -> dict | None:
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            logger.warning("trafilatura could not fetch %s", url)
            return None

        html = trafilatura.extract(
            downloaded,
            output_format="html",
            include_formatting=True,
            include_comments=False,
            include_tables=True,
            include_links=True,
            include_images=True,
        )

        text = trafilatura.extract(
            downloaded,
            output_format="txt",
            include_formatting=True,
            include_comments=False,
            include_tables=True,
            include_links=True,
            include_images=True,
        )

        if not html and not text:
            logger.warning("trafilatura extracted no content from %s", url)
            return None

        metadata = trafilatura.extract_metadata(downloaded)

        title = None
        author = None
        published_at = None
        if metadata:
            title = metadata.title
            author = metadata.author
            published_at = metadata.date

        return {
            "html": html or "",
            "text": text or "",
            "title": title,
            "author": author,
            "published_at": published_at,
        }
