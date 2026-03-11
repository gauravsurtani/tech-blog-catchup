"""TTS-only podcast generator — converts pre-generated podcast scripts to audio.

Supports parallel TTS generation via asyncio for ~3-5x speedup on multi-segment podcasts.
"""

import asyncio
import logging
import os
import re
import time
from pathlib import Path

from src.config import Config
from src.models import Post

logger = logging.getLogger(__name__)


def _parse_script_segments(script: str) -> list[tuple[str, str]]:
    """Parse a podcast script into (speaker, text) segments.

    Expects XML-style tags: <Person1>text</Person1> <Person2>text</Person2>
    Returns list of ("person1", "text") or ("person2", "text") tuples.
    """
    segments: list[tuple[str, str]] = []
    pattern = re.compile(r"<(Person[12])>(.*?)</\1>", re.DOTALL)
    for match in pattern.finditer(script):
        speaker = match.group(1).lower()
        text = match.group(2).strip()
        if text:
            segments.append((speaker, text))
    return segments


async def _generate_segment_async(
    client: object,
    text: str,
    voice: str,
    model: str,
) -> bytes:
    """Generate TTS audio for a single segment using the async OpenAI client.

    Args:
        client: AsyncOpenAI client instance.
        text: The text to synthesize.
        voice: TTS voice name (e.g., "nova", "onyx").
        model: TTS model name (e.g., "tts-1").

    Returns:
        Raw MP3 audio bytes.
    """
    response = await client.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        response_format="mp3",
    )
    return response.content


async def _generate_segments_parallel(
    segments: list[tuple[str, str]],
    api_key: str,
    voice_map: dict[str, str],
    tts_model: str,
    concurrency: int = 5,
) -> list[bytes]:
    """Generate TTS audio for all segments in parallel batches.

    Processes segments in batches of `concurrency` to avoid overwhelming
    the OpenAI API. Order is preserved — output[i] corresponds to segments[i].

    Args:
        segments: List of (speaker, text) tuples.
        api_key: OpenAI API key.
        voice_map: Mapping of speaker name to voice (e.g., {"person1": "nova"}).
        tts_model: TTS model name.
        concurrency: Max parallel requests per batch.

    Returns:
        List of raw MP3 audio bytes, one per segment, in order.
    """
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    audio_chunks: list[bytes] = []

    for batch_start in range(0, len(segments), concurrency):
        batch = segments[batch_start:batch_start + concurrency]
        tasks = [
            _generate_segment_async(client, text, voice_map[speaker], tts_model)
            for speaker, text in batch
        ]
        results = await asyncio.gather(*tasks)
        audio_chunks.extend(results)

    return audio_chunks


def generate_podcast_for_post(post: Post, config: Config) -> tuple[str, int] | None:
    """Generate podcast audio from a post's pre-generated podcast_script.

    Uses OpenAI TTS API to synthesize each speaker segment. Attempts parallel
    generation via asyncio first; falls back to sequential on failure.

    Returns (audio_path, duration_secs) or None on failure.
    audio_path is relative to the backend/ directory (e.g., "audio/uber_42.mp3").
    """
    if not post.podcast_script:
        logger.error("Post %d has no podcast_script, cannot generate audio", post.id)
        return None

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.error("OPENAI_API_KEY not set, cannot generate TTS audio")
        return None

    env_audio_dir = os.environ.get("AUDIO_DIR")
    if env_audio_dir:
        audio_dir = Path(env_audio_dir)
    else:
        audio_dir = Path(__file__).parent.parent.parent / config.app.get("audio_dir", "audio")
    audio_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{post.source_key}_{post.id}.mp3"
    output_path = audio_dir / filename

    podcast_cfg = config.podcast
    voice_person1 = podcast_cfg.get("voice_person1", "nova")
    voice_person2 = podcast_cfg.get("voice_person2", "onyx")
    tts_model = podcast_cfg.get("tts_model_name", "tts-1")

    segments = _parse_script_segments(post.podcast_script)
    if not segments:
        logger.error("No valid segments parsed from podcast_script for post %d", post.id)
        return None

    voice_map = {"person1": voice_person1, "person2": voice_person2}

    try:
        # Attempt parallel generation first
        start_time = time.monotonic()
        audio_chunks = asyncio.run(
            _generate_segments_parallel(segments, api_key, voice_map, tts_model)
        )
        elapsed = time.monotonic() - start_time
        logger.info(
            "Parallel TTS for post %d: %d segments in %.1fs",
            post.id, len(segments), elapsed,
        )
    except Exception:
        logger.warning(
            "Parallel TTS failed for post %d, falling back to sequential",
            post.id,
            exc_info=True,
        )
        # Fallback: sequential generation
        try:
            from openai import OpenAI

            client = OpenAI()
            audio_chunks = []

            start_time = time.monotonic()
            for speaker, text in segments:
                voice = voice_map[speaker]
                response = client.audio.speech.create(
                    model=tts_model,
                    voice=voice,
                    input=text,
                    response_format="mp3",
                )
                audio_chunks.append(response.content)

            elapsed = time.monotonic() - start_time
            logger.info(
                "Sequential TTS for post %d: %d segments in %.1fs",
                post.id, len(segments), elapsed,
            )
        except Exception:
            logger.exception("Failed to generate podcast audio for post %d", post.id)
            return None

    try:
        # Concatenate MP3 chunks
        with open(output_path, "wb") as f:
            for chunk in audio_chunks:
                f.write(chunk)

        duration = _get_audio_duration(output_path)
        relative_path = f"audio/{filename}"
        logger.info("Generated podcast for post %d: %s (%ds)", post.id, relative_path, duration)
        return relative_path, duration

    except Exception:
        logger.exception("Failed to write podcast audio for post %d", post.id)
        return None


def _get_audio_duration(path: Path) -> int:
    """Get audio duration in seconds. Returns estimate if mutagen unavailable."""
    try:
        from mutagen.mp3 import MP3
        audio = MP3(str(path))
        return int(audio.info.length)
    except Exception:
        # Rough estimate: file size / ~16KB per second at 128kbps
        file_size = path.stat().st_size
        return max(1, file_size // 16000)
