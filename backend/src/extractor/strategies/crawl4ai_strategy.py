import logging

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

from src.extractor.strategies.base import ExtractionStrategy

logger = logging.getLogger(__name__)


class Crawl4AIStrategy(ExtractionStrategy):
    """JS-rendered fallback using Crawl4AI with headless browser."""

    name: str = "crawl4ai"

    async def extract(self, url: str, timeout: int = 30) -> dict | None:
        """Extract content using Crawl4AI's async web crawler."""
        try:
            browser_config = BrowserConfig(headless=True)
            run_config = CrawlerRunConfig(
                word_count_threshold=100,
                excluded_tags=["nav", "header", "footer", "aside"],
            )

            async with AsyncWebCrawler(config=browser_config) as crawler:
                result = await crawler.arun(url=url, config=run_config)

            if not result or not result.success:
                logger.warning("crawl4ai returned no result for %s", url)
                return None

            html = result.html or ""
            text = result.markdown or ""

            title = None
            author = None
            published_at = None
            if result.metadata:
                title = result.metadata.get("title")
                author = result.metadata.get("author")
                published_at = result.metadata.get("published_at") or result.metadata.get("date")

            return {
                "html": html,
                "text": text,
                "title": title,
                "author": author,
                "published_at": published_at,
            }
        except Exception:
            logger.exception("crawl4ai extraction failed for %s", url)
            return None
