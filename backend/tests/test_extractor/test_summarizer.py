"""Tests for the content_generator module (replaces old summarizer tests)."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestGenerateContent:
    async def test_raises_without_api_key(self):
        with patch.dict("os.environ", {}, clear=True):
            from src.extractor.content_generator import generate_content
            with pytest.raises(ValueError, match="OPENAI_API_KEY"):
                await generate_content("Title", "Some markdown content")

    async def test_returns_summary_and_script(self):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"summary": "A great summary.", "podcast_script": "<Person1>Hello</Person1>"}'

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}), \
             patch("openai.AsyncOpenAI", return_value=mock_client):
            from src.extractor.content_generator import generate_content
            result = await generate_content("Test Title", "Test markdown content")
            assert result["summary"] == "A great summary."
            assert result["podcast_script"] == "<Person1>Hello</Person1>"

    async def test_graceful_degradation_on_exception(self):
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=Exception("API error"))

        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}), \
             patch("openai.AsyncOpenAI", return_value=mock_client):
            from src.extractor.content_generator import generate_content
            result = await generate_content("Title", "Some content here")
            assert result["summary"] == "Some content here"[:500]
            assert result["podcast_script"] is None

    async def test_empty_response_fallback(self):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = None

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}), \
             patch("openai.AsyncOpenAI", return_value=mock_client):
            from src.extractor.content_generator import generate_content
            result = await generate_content("Title", "Markdown text")
            assert result["summary"] == "Markdown text"[:500]
            assert result["podcast_script"] is None


class TestGenerateSummaryOnly:
    async def test_raises_without_api_key(self):
        with patch.dict("os.environ", {}, clear=True):
            from src.extractor.content_generator import generate_summary_only
            with pytest.raises(ValueError, match="OPENAI_API_KEY"):
                await generate_summary_only("Title", "Content")

    async def test_returns_summary(self):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"summary": "Just a summary."}'

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}), \
             patch("openai.AsyncOpenAI", return_value=mock_client):
            from src.extractor.content_generator import generate_summary_only
            result = await generate_summary_only("Title", "Content")
            assert result == "Just a summary."
