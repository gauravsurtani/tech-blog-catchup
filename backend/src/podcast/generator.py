"""TTS-only podcast generator — converts pre-generated podcast scripts to audio."""

import logging
import os
import re
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


def generate_podcast_for_post(post: Post, config: Config) -> tuple[str, int] | None:
    """Generate podcast audio from a post's pre-generated podcast_script.

    Uses OpenAI TTS API directly to synthesize each speaker segment,
    then concatenates into a single MP3.

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

    try:
        from openai import OpenAI

        client = OpenAI()
        audio_chunks: list[bytes] = []

        for speaker, text in segments:
            voice = voice_person1 if speaker == "person1" else voice_person2
            response = client.audio.speech.create(
                model=tts_model,
                voice=voice,
                input=text,
                response_format="mp3",
            )
            audio_chunks.append(response.content)

        # Concatenate MP3 chunks
        with open(output_path, "wb") as f:
            for chunk in audio_chunks:
                f.write(chunk)

        duration = _get_audio_duration(output_path)
        relative_path = f"audio/{filename}"
        logger.info("Generated podcast for post %d: %s (%ds)", post.id, relative_path, duration)
        return relative_path, duration

    except Exception:
        logger.exception("Failed to generate podcast audio for post %d", post.id)
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
