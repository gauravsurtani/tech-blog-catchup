"""Extraction pipeline orchestrator — strategy selection, fallback chain, quality check."""

import asyncio
import logging
from datetime import datetime

from src.extractor.types import ExtractionResult, QualityResult
from src.extractor.quality_scorer import score_content
from src.extractor.html_to_markdown import html_to_markdown
from src.extractor.content_cleaner import clean_html, clean_markdown
from src.extractor.content_generator import generate_content
from src.extractor.content_scanner import is_useful_content
from src.extractor.strategies.trafilatura_strategy import TrafilaturaStrategy
from src.extractor.strategies.crawl4ai_strategy import Crawl4AIStrategy
from src.extractor.strategies.bs4_strategy import BS4Strategy
from src.extractor.strategies.llm_strategy import LLMStrategy

logger = logging.getLogger(__name__)


def _build_fallback_chain(needs_browser: bool = False):
    """Build the extraction strategy chain based on source requirements."""
    if needs_browser:
        return [Crawl4AIStrategy(), LLMStrategy(), TrafilaturaStrategy(), BS4Strategy()]
    return [LLMStrategy(), TrafilaturaStrategy(), BS4Strategy()]


async def extract_article(
    url: str,
    source_key: str = "",
    needs_browser: bool = False,
    article_selector: str | None = None,
    strip_selectors: list[str] | None = None,
    timeout: int = 30,
) -> ExtractionResult | None:
    """Extract and process a single article through the full pipeline.

    Pipeline steps:
    1. Try each strategy in the fallback chain until one succeeds
    2. Clean the raw HTML
    3. Convert to markdown
    4. Clean the markdown
    5. Score content quality
    6. Extract summary
    7. Return ExtractionResult (or None if all strategies fail)

    Args:
        url: Article URL to extract.
        source_key: Source identifier for logging.
        needs_browser: If True, Crawl4AI is tried first (for JS-rendered sites).
        article_selector: CSS selector to isolate article content.
        strip_selectors: Additional CSS selectors to remove.
        timeout: Request timeout in seconds.

    Returns:
        ExtractionResult or None if extraction fails entirely.
    """
    chain = _build_fallback_chain(needs_browser)
    raw_result = None
    method_used = ""

    for strategy in chain:
        try:
            logger.info("[%s] Trying %s for %s", source_key, strategy.name, url)
            raw_result = await strategy.extract(url, timeout=timeout)
            if raw_result and (raw_result.get("html") or raw_result.get("text")):
                method_used = strategy.name
                logger.info("[%s] %s succeeded for %s", source_key, strategy.name, url)
                break
            logger.warning("[%s] %s returned empty for %s", source_key, strategy.name, url)
            raw_result = None
        except Exception as exc:
            logger.warning("[%s] %s failed for %s: %s", source_key, strategy.name, url, exc)
            raw_result = None

    if raw_result is None:
        logger.error("[%s] All strategies failed for %s", source_key, url)
        return None

    # Step 2: Clean HTML (if we have HTML)
    raw_html = raw_result.get("html", "")
    if raw_html:
        cleaned_html = clean_html(raw_html, article_selector=article_selector, strip_selectors=strip_selectors)
        # Step 3: Convert to markdown
        markdown = html_to_markdown(cleaned_html)
    else:
        # Some strategies return text/markdown directly
        markdown = raw_result.get("text", "")

    # Step 4: Clean markdown
    markdown = clean_markdown(markdown)

    if not markdown.strip():
        logger.warning("[%s] Empty markdown after cleaning for %s", source_key, url)
        return None

    # Step 5: Content scanner — LLM decides if this is a real article
    title = raw_result.get("title") or url
    is_article = await is_useful_content(title, markdown, url)
    if not is_article:
        logger.info("[%s] Content scanner rejected %s as non-article", source_key, url)
        return None

    # Step 6: Score quality
    quality = score_content(markdown)

    # Step 7: Generate summary + podcast script via LLM
    content = await generate_content(title, markdown)
    summary = content.get("summary", "")
    podcast_script = content.get("podcast_script")

    author = raw_result.get("author")
    published_at = raw_result.get("published_at")
    # Ensure published_at is a datetime (strategies may return strings)
    if isinstance(published_at, str):
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S%z"):
            try:
                published_at = datetime.strptime(published_at, fmt).replace(tzinfo=None)
                break
            except ValueError:
                continue
        else:
            published_at = None
    elif hasattr(published_at, 'tzinfo') and published_at is not None and published_at.tzinfo:
        published_at = published_at.replace(tzinfo=None)
    word_count = quality.word_count

    return ExtractionResult(
        url=url,
        title=title,
        markdown=markdown,
        summary=summary,
        word_count=word_count,
        quality=quality,
        extraction_method=method_used,
        author=author,
        published_at=published_at,
        podcast_script=podcast_script,
    )


async def extract_articles_batch(
    urls: list[str],
    source_key: str = "",
    needs_browser: bool = False,
    article_selector: str | None = None,
    strip_selectors: list[str] | None = None,
    delay: float = 1.5,
    timeout: int = 30,
    min_quality: int = 20,
) -> list[ExtractionResult]:
    """Extract multiple articles sequentially with quality filtering.

    Args:
        urls: List of article URLs.
        source_key: Source identifier for logging.
        needs_browser: If True, use Crawl4AI first for JS sites.
        article_selector: CSS selector to isolate article content.
        strip_selectors: Additional CSS selectors to remove.
        delay: Seconds between requests.
        timeout: Request timeout in seconds.
        min_quality: Minimum quality score to include (default 20, rejects F-grade).

    Returns:
        List of ExtractionResult objects that pass quality filtering.
    """
    results: list[ExtractionResult] = []

    for i, url in enumerate(urls):
        logger.info("Extracting %d/%d: %s", i + 1, len(urls), url)

        try:
            result = await extract_article(
                url=url,
                source_key=source_key,
                needs_browser=needs_browser,
                article_selector=article_selector,
                strip_selectors=strip_selectors,
                timeout=timeout,
            )

            if result is None:
                logger.warning("  -> SKIP (extraction failed): %s", url)
            elif result.quality.score < min_quality:
                logger.warning(
                    "  -> REJECT (quality %d/%s): %s",
                    result.quality.score, result.quality.grade, url,
                )
            else:
                results.append(result)
                logger.info(
                    "  -> OK: %s (quality=%d/%s, %d words, method=%s)",
                    result.title[:60], result.quality.score,
                    result.quality.grade, result.word_count, result.extraction_method,
                )
        except Exception as exc:
            logger.error("  -> ERROR extracting %s: %s", url, exc)

        # Rate limiting delay
        if i < len(urls) - 1 and delay > 0:
            await asyncio.sleep(delay)

    logger.info(
        "Batch extraction complete: %d/%d passed quality filter (min=%d)",
        len(results), len(urls), min_quality,
    )
    return results
