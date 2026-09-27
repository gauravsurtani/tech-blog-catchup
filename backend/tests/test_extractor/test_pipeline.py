"""Extraction uses validated source fetching, never remote model browsing."""

from unittest.mock import AsyncMock, patch
import pytest
from src.extractor.pipeline import extract_article, _build_fallback_chain
from src.extractor.safe_fetch import fetch_article


@pytest.mark.parametrize("browser", [False, True])
def test_safe_fetch_is_only_network_strategy(browser):
    assert [s.name for s in _build_fallback_chain(browser)] == ["source_html"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/private",
        "http://[::1]/",
        "file:///etc/passwd",
        "http://user:pass@example.com/",
        "http://169.254.169.254/latest/meta-data/",
    ],
)
async def test_private_source_rejected(url):
    with pytest.raises(ValueError):
        await fetch_article(url)


@pytest.mark.asyncio
async def test_pipeline_preserves_fetched_content():
    body = "A cache stores recent data. Stale data must be refreshed. " * 30
    with (
        patch(
            "src.extractor.strategies.llm_strategy.fetch_article",
            new=AsyncMock(
                return_value="<html><title>Caching</title><article><p>"
                + body
                + "</p></article></html>"
            ),
        ),
        patch(
            "src.extractor.pipeline.is_useful_content", new=AsyncMock(return_value=True)
        ),
        patch(
            "src.extractor.pipeline.generate_content",
            new=AsyncMock(
                return_value={"summary": "Cache facts", "podcast_script": None}
            ),
        ),
    ):
        result = await extract_article("https://example.com/article")
        assert result is not None and "Stale data must be refreshed." in result.markdown
        assert result.extraction_method == "source_html"
