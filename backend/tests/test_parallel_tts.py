"""Tests for parallel TTS generation via asyncio.

Verifies that:
1. _parse_script_segments() still works correctly
2. Async batch generation maintains segment order
3. Batching groups segments correctly by concurrency
4. Fallback to sequential on async error
5. (Optional) Real TTS with API key
"""

import asyncio
import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.podcast.generator import _parse_script_segments


class TestParseSegments:
    """_parse_script_segments() parsing correctness."""

    def test_basic_two_speakers(self):
        script = "<Person1>Hello</Person1><Person2>World</Person2>"
        segments = _parse_script_segments(script)
        assert len(segments) == 2
        assert segments[0] == ("person1", "Hello")
        assert segments[1] == ("person2", "World")

    def test_multiline_segments(self):
        script = "<Person1>Line one.\nLine two.</Person1><Person2>Reply here.</Person2>"
        segments = _parse_script_segments(script)
        assert len(segments) == 2
        assert "Line one." in segments[0][1]
        assert "Line two." in segments[0][1]

    def test_empty_segments_skipped(self):
        script = "<Person1></Person1><Person2>Real text</Person2>"
        segments = _parse_script_segments(script)
        assert len(segments) == 1
        assert segments[0] == ("person2", "Real text")

    def test_many_segments_order(self):
        parts = [f"<Person{1 + i % 2}>Segment {i}</Person{1 + i % 2}>" for i in range(20)]
        script = "".join(parts)
        segments = _parse_script_segments(script)
        assert len(segments) == 20
        for i, (speaker, text) in enumerate(segments):
            assert text == f"Segment {i}"


class TestAsyncBatchGeneration:
    """_generate_segments_parallel() maintains order and batching."""

    async def test_order_preserved_with_concurrency(self):
        """10 segments with concurrency=3 should return in original order."""
        from src.podcast.generator import _generate_segments_parallel

        segments = [(f"person{1 + i % 2}", f"Text {i}") for i in range(10)]

        # Mock that returns the segment text as bytes (so we can verify order)
        async def mock_tts(client, text, voice, model):
            return text.encode("utf-8")

        with patch("src.podcast.generator._generate_segment_async", side_effect=mock_tts):
            results = await _generate_segments_parallel(
                segments,
                api_key="fake-key",
                voice_map={"person1": "nova", "person2": "onyx"},
                tts_model="tts-1",
                concurrency=3,
            )

        assert len(results) == 10
        for i, chunk in enumerate(results):
            assert chunk == f"Text {i}".encode("utf-8")

    async def test_concurrency_5_two_batches(self):
        """10 segments with concurrency=5 should process in 2 batches."""
        from src.podcast.generator import _generate_segments_parallel

        segments = [(f"person{1 + i % 2}", f"Text {i}") for i in range(10)]
        batch_calls = []

        original_gather = asyncio.gather

        async def tracking_gather(*coros, **kwargs):
            batch_calls.append(len(coros))
            return await original_gather(*coros, **kwargs)

        async def mock_tts(client, text, voice, model):
            return text.encode("utf-8")

        with patch("src.podcast.generator._generate_segment_async", side_effect=mock_tts), \
             patch("src.podcast.generator.asyncio.gather", side_effect=tracking_gather):
            results = await _generate_segments_parallel(
                segments,
                api_key="fake-key",
                voice_map={"person1": "nova", "person2": "onyx"},
                tts_model="tts-1",
                concurrency=5,
            )

        assert len(results) == 10
        assert batch_calls == [5, 5]

    async def test_concurrency_3_three_batches(self):
        """7 segments with concurrency=3 should process in 3 batches (3, 3, 1)."""
        from src.podcast.generator import _generate_segments_parallel

        segments = [(f"person{1 + i % 2}", f"Text {i}") for i in range(7)]
        batch_calls = []

        original_gather = asyncio.gather

        async def tracking_gather(*coros, **kwargs):
            batch_calls.append(len(coros))
            return await original_gather(*coros, **kwargs)

        async def mock_tts(client, text, voice, model):
            return text.encode("utf-8")

        with patch("src.podcast.generator._generate_segment_async", side_effect=mock_tts), \
             patch("src.podcast.generator.asyncio.gather", side_effect=tracking_gather):
            results = await _generate_segments_parallel(
                segments,
                api_key="fake-key",
                voice_map={"person1": "nova", "person2": "onyx"},
                tts_model="tts-1",
                concurrency=3,
            )

        assert len(results) == 7
        assert batch_calls == [3, 3, 1]

    async def test_single_segment(self):
        """1 segment should work fine (1 batch of 1)."""
        from src.podcast.generator import _generate_segments_parallel

        segments = [("person1", "Solo")]

        async def mock_tts(client, text, voice, model):
            return text.encode("utf-8")

        with patch("src.podcast.generator._generate_segment_async", side_effect=mock_tts):
            results = await _generate_segments_parallel(
                segments,
                api_key="fake-key",
                voice_map={"person1": "nova", "person2": "onyx"},
                tts_model="tts-1",
                concurrency=5,
            )

        assert len(results) == 1
        assert results[0] == b"Solo"


class TestFallbackToSequential:
    """generate_podcast_for_post falls back to sequential if async fails."""

    def test_fallback_on_async_error(self, tmp_path):
        """If parallel generation raises, fallback to sequential should still work."""
        from src.podcast.generator import generate_podcast_for_post
        from src.models import Post

        post = MagicMock(spec=Post)
        post.id = 1
        post.source_key = "test"
        post.title = "Test Post"
        post.podcast_script = "<Person1>Hello</Person1><Person2>World</Person2>"

        config = MagicMock()
        config.podcast = {"voice_person1": "nova", "voice_person2": "onyx", "tts_model_name": "tts-1"}
        config.app = {"audio_dir": str(tmp_path / "audio")}

        mock_speech = MagicMock()
        mock_speech.content = b"fake-audio-bytes"

        mock_client = MagicMock()
        mock_client.audio.speech.create.return_value = mock_speech

        with patch.dict(os.environ, {"OPENAI_API_KEY": "fake-key"}), \
             patch.dict(os.environ, {"AUDIO_DIR": ""}, clear=False), \
             patch("src.podcast.generator._generate_segments_parallel", side_effect=Exception("async failed")), \
             patch("openai.OpenAI", return_value=mock_client), \
             patch("src.podcast.generator._get_audio_duration", return_value=60):
            # Remove AUDIO_DIR to use config path
            os.environ.pop("AUDIO_DIR", None)
            result = generate_podcast_for_post(post, config)

        assert result is not None
        audio_path, duration = result
        assert "test_1.mp3" in audio_path
        assert duration == 60


class TestEndToEndParallelFlow:
    """Integration: generate_podcast_for_post uses parallel path when available."""

    def test_parallel_path_used(self, tmp_path):
        """Verify that generate_podcast_for_post calls _generate_segments_parallel."""
        from src.podcast.generator import generate_podcast_for_post
        from src.models import Post

        post = MagicMock(spec=Post)
        post.id = 42
        post.source_key = "uber"
        post.title = "Parallel Test"
        post.podcast_script = "<Person1>A</Person1><Person2>B</Person2><Person1>C</Person1>"

        config = MagicMock()
        config.podcast = {"voice_person1": "nova", "voice_person2": "onyx", "tts_model_name": "tts-1"}
        config.app = {"audio_dir": str(tmp_path / "audio")}

        async def mock_parallel(segments, api_key, voice_map, tts_model, concurrency=5):
            return [b"chunk1", b"chunk2", b"chunk3"]

        with patch.dict(os.environ, {"OPENAI_API_KEY": "fake-key"}), \
             patch("src.podcast.generator._generate_segments_parallel", side_effect=mock_parallel), \
             patch("src.podcast.generator._get_audio_duration", return_value=120):
            os.environ.pop("AUDIO_DIR", None)
            result = generate_podcast_for_post(post, config)

        assert result is not None
        audio_path, duration = result
        assert "uber_42.mp3" in audio_path
        assert duration == 120

        # Verify the file was written
        output_file = tmp_path / "audio" / "uber_42.mp3"
        assert output_file.exists()
        assert output_file.read_bytes() == b"chunk1chunk2chunk3"


@pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="No OPENAI_API_KEY set")
class TestRealTTS:
    """Real TTS integration test — only runs when API key is available."""

    def test_real_tts_two_segments(self, tmp_path):
        from src.podcast.generator import generate_podcast_for_post
        from src.models import Post

        post = MagicMock(spec=Post)
        post.id = 999
        post.source_key = "test"
        post.title = "Real TTS Test"
        post.podcast_script = "<Person1>Hello world.</Person1><Person2>Goodbye world.</Person2>"

        config = MagicMock()
        config.podcast = {"voice_person1": "nova", "voice_person2": "onyx", "tts_model_name": "tts-1"}
        config.app = {"audio_dir": str(tmp_path / "audio")}

        os.environ.pop("AUDIO_DIR", None)
        result = generate_podcast_for_post(post, config)

        assert result is not None
        audio_path, duration = result
        assert "test_999.mp3" in audio_path
        assert duration > 0
        assert (tmp_path / "audio" / "test_999.mp3").stat().st_size > 1000
