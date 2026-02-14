"""Tests for the Jina Reader extraction strategy."""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock

import httpx

from src.extractor.strategies.jina import JinaStrategy


class TestJinaExtraction:
    async def test_successful_extraction(self):
        strategy = JinaStrategy()

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "data": {
                "content": "# Great Article\n\n" + "This is excellent content. " * 20,
                "title": "Great Article",
            }
        }

        with patch("src.extractor.strategies.jina.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.get = AsyncMock(return_value=mock_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/article")
            assert result is not None
            assert result["title"] == "Great Article"
            assert len(result["text"]) > 100

    async def test_too_short_content_returns_none(self):
        strategy = JinaStrategy()

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "data": {
                "content": "Short.",
                "title": "Short",
            }
        }

        with patch("src.extractor.strategies.jina.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.get = AsyncMock(return_value=mock_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/short")
            assert result is None

    async def test_404_returns_none(self):
        strategy = JinaStrategy()

        mock_resp = MagicMock()
        mock_resp.status_code = 404

        with patch("src.extractor.strategies.jina.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.get = AsyncMock(return_value=mock_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/missing")
            assert result is None

    async def test_timeout_returns_none(self):
        strategy = JinaStrategy()

        with patch("src.extractor.strategies.jina.httpx.AsyncClient") as mock_cls:
            client = AsyncMock()
            client.get = AsyncMock(side_effect=httpx.TimeoutException("timed out"))
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await strategy.extract("https://example.com/slow")
            assert result is None
