"""Tests for the Firecrawl extraction strategy."""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock

import httpx

from src.extractor.strategies.firecrawl import FirecrawlStrategy


class TestFirecrawlAvailability:
    def test_unavailable_without_api_key(self):
        with patch.dict("os.environ", {}, clear=True):
            strategy = FirecrawlStrategy()
            strategy._api_key = ""
            assert strategy.available is False

    def test_available_with_api_key(self):
        strategy = FirecrawlStrategy()
        strategy._api_key = "fc-test-key-123"
        assert strategy.available is True

    async def test_returns_none_without_api_key(self):
        strategy = FirecrawlStrategy()
        strategy._api_key = ""
        result = await strategy.extract("https://example.com/article")
        assert result is None


class TestFirecrawlExtraction:
    async def test_successful_extraction(self):
        strategy = FirecrawlStrategy()
        strategy._api_key = "fc-test-key"

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "success": True,
            "data": {
                "markdown": "# Article Title\n\nGreat content here.",
                "html": "<h1>Article Title</h1><p>Great content here.</p>",
                "metadata": {
                    "title": "Article Title",
                    "author": "John Doe",
                    "publishedTime": "2024-01-15",
                },
            },
        }

        with patch("src.extractor.strategies.firecrawl.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.post = AsyncMock(return_value=mock_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/article")
            assert result is not None
            assert result["title"] == "Article Title"
            assert result["author"] == "John Doe"
            assert "Great content" in result["text"]

    async def test_rate_limited_429(self):
        strategy = FirecrawlStrategy()
        strategy._api_key = "fc-test-key"

        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_resp.text = "Rate limited"

        with patch("src.extractor.strategies.firecrawl.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.post = AsyncMock(return_value=mock_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/article")
            assert result is None

    async def test_credit_limit_402(self):
        strategy = FirecrawlStrategy()
        strategy._api_key = "fc-test-key"

        mock_resp = MagicMock()
        mock_resp.status_code = 402
        mock_resp.text = "Payment required"

        with patch("src.extractor.strategies.firecrawl.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.post = AsyncMock(return_value=mock_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/article")
            assert result is None

    async def test_server_error_500(self):
        strategy = FirecrawlStrategy()
        strategy._api_key = "fc-test-key"

        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = "Internal server error"

        with patch("src.extractor.strategies.firecrawl.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.post = AsyncMock(return_value=mock_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/article")
            assert result is None

    async def test_timeout_returns_none(self):
        strategy = FirecrawlStrategy()
        strategy._api_key = "fc-test-key"

        with patch("src.extractor.strategies.firecrawl.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.post = AsyncMock(side_effect=httpx.TimeoutException("timed out"))
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/article")
            assert result is None

    async def test_extraction_failure_in_response(self):
        strategy = FirecrawlStrategy()
        strategy._api_key = "fc-test-key"

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"success": False}

        with patch("src.extractor.strategies.firecrawl.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.post = AsyncMock(return_value=mock_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/article")
            assert result is None
