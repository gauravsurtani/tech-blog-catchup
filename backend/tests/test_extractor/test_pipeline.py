"""Tests for the extraction pipeline orchestrator."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from src.extractor.pipeline import extract_article, extract_articles_batch, _build_fallback_chain


class TestBuildFallbackChain:
    def test_default_chain(self):
        chain = _build_fallback_chain(needs_browser=False)
        names = [s.name for s in chain]
        assert names == ["llm", "trafilatura", "bs4"]

    def test_browser_chain(self):
        chain = _build_fallback_chain(needs_browser=True)
        names = [s.name for s in chain]
        assert names == ["crawl4ai", "llm", "trafilatura", "bs4"]


class TestExtractArticle:
    @pytest.fixture
    def mock_llm(self):
        with patch("src.extractor.pipeline.LLMStrategy") as mock:
            strategy = MagicMock()
            strategy.name = "llm"
            strategy.extract = AsyncMock(return_value=None)
            mock.return_value = strategy
            yield strategy

    @pytest.fixture
    def mock_trafilatura(self):
        with patch("src.extractor.pipeline.TrafilaturaStrategy") as mock:
            strategy = MagicMock()
            strategy.name = "trafilatura"
            strategy.extract = AsyncMock(return_value={
                "html": "<h1>Test</h1><p>This is a well-written article about technology with lots of content. " * 20 + "</p>",
                "text": "Test article content",
                "title": "Test Article",
                "author": "Author",
                "published_at": None,
            })
            mock.return_value = strategy
            yield strategy

    @pytest.fixture
    def mock_bs4(self):
        with patch("src.extractor.pipeline.BS4Strategy") as mock:
            strategy = MagicMock()
            strategy.name = "bs4"
            strategy.extract = AsyncMock(return_value=None)
            mock.return_value = strategy
            yield strategy

    async def test_successful_extraction(self, mock_llm, mock_trafilatura, mock_bs4):
        with patch("src.extractor.pipeline.is_useful_content", new_callable=AsyncMock, return_value=True), \
             patch("src.extractor.pipeline.generate_content", new_callable=AsyncMock, return_value={"summary": "Test summary", "podcast_script": "<Person1>Hi</Person1>"}):
            result = await extract_article("https://example.com/article", source_key="test")
            assert result is not None
            assert result.url == "https://example.com/article"
            assert result.extraction_method == "trafilatura"
            assert result.quality.score > 0
            assert result.summary == "Test summary"
            assert result.podcast_script == "<Person1>Hi</Person1>"

    async def test_all_strategies_fail(self):
        with patch("src.extractor.pipeline.LLMStrategy") as llm_mock, \
             patch("src.extractor.pipeline.TrafilaturaStrategy") as traf_mock, \
             patch("src.extractor.pipeline.BS4Strategy") as bs4_mock:
            llm = MagicMock()
            llm.name = "llm"
            llm.extract = AsyncMock(return_value=None)
            llm_mock.return_value = llm

            traf = MagicMock()
            traf.name = "trafilatura"
            traf.extract = AsyncMock(return_value=None)
            traf_mock.return_value = traf

            bs4 = MagicMock()
            bs4.name = "bs4"
            bs4.extract = AsyncMock(return_value=None)
            bs4_mock.return_value = bs4

            result = await extract_article("https://example.com/fail")
            assert result is None

    async def test_fallback_to_bs4(self):
        with patch("src.extractor.pipeline.LLMStrategy") as llm_mock, \
             patch("src.extractor.pipeline.TrafilaturaStrategy") as traf_mock, \
             patch("src.extractor.pipeline.BS4Strategy") as bs4_mock, \
             patch("src.extractor.pipeline.is_useful_content", new_callable=AsyncMock, return_value=True), \
             patch("src.extractor.pipeline.generate_content", new_callable=AsyncMock, return_value={"summary": "Fallback summary", "podcast_script": None}):
            llm = MagicMock()
            llm.name = "llm"
            llm.extract = AsyncMock(return_value=None)
            llm_mock.return_value = llm

            traf = MagicMock()
            traf.name = "trafilatura"
            traf.extract = AsyncMock(return_value=None)
            traf_mock.return_value = traf

            bs4 = MagicMock()
            bs4.name = "bs4"
            bs4.extract = AsyncMock(return_value={
                "html": "<article><h1>Fallback</h1><p>Good content from BS4 extraction. " * 20 + "</p></article>",
                "text": "Fallback content",
                "title": "Fallback Article",
                "author": None,
                "published_at": None,
            })
            bs4_mock.return_value = bs4

            result = await extract_article("https://example.com/fallback")
            assert result is not None
            assert result.extraction_method == "bs4"


class TestExtractArticlesBatch:
    async def test_empty_urls(self):
        results = await extract_articles_batch([])
        assert results == []

    async def test_filters_low_quality(self):
        with patch("src.extractor.pipeline.LLMStrategy") as llm_mock, \
             patch("src.extractor.pipeline.TrafilaturaStrategy") as traf_mock, \
             patch("src.extractor.pipeline.BS4Strategy") as bs4_mock, \
             patch("src.extractor.pipeline.is_useful_content", new_callable=AsyncMock, return_value=True), \
             patch("src.extractor.pipeline.generate_content", new_callable=AsyncMock, return_value={"summary": "Short", "podcast_script": None}):
            llm = MagicMock()
            llm.name = "llm"
            llm.extract = AsyncMock(return_value=None)
            llm_mock.return_value = llm

            traf = MagicMock()
            traf.name = "trafilatura"
            traf.extract = AsyncMock(return_value={
                "html": "<p>Tiny</p>",
                "text": "Tiny",
                "title": "Tiny",
                "author": None,
                "published_at": None,
            })
            traf_mock.return_value = traf

            bs4 = MagicMock()
            bs4.name = "bs4"
            bs4.extract = AsyncMock(return_value=None)
            bs4_mock.return_value = bs4

            results = await extract_articles_batch(
                ["https://example.com/short"],
                delay=0,
                min_quality=30,
            )
            # Very short content (score=20) should be rejected at min_quality=30
            assert len(results) == 0
