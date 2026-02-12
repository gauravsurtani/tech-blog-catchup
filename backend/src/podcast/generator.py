"""Podcastfy wrapper: convert blog post content to conversational podcast MP3."""

import os
import shutil
import logging
from pathlib import Path

from src.config import Config
from src.models import Post

logger = logging.getLogger(__name__)


def _get_conversation_config(config: Config) -> dict:
    """Build Podcastfy conversation_config from our config.yaml settings."""
    podcast_cfg = config.podcast
    return {
        "word_count": 3000,
        "conversation_style": podcast_cfg.get("conversation_style", ["engaging", "educational"]),
        "roles_person1": podcast_cfg.get("roles_person1", "Main host - explains concepts clearly"),
        "roles_person2": podcast_cfg.get("roles_person2", "Co-host - asks insightful questions"),
        "dialogue_structure": podcast_cfg.get("dialogue_structure", [
            "Introduction", "Main Discussion", "Key Takeaways", "Wrap-up"
        ]),
        "output_language": podcast_cfg.get("output_language", "English"),
        "engagement_techniques": podcast_cfg.get("engagement_techniques", [
            "analogies", "real-world examples", "humor where appropriate"
        ]),
    }


def generate_podcast_for_post(post: Post, config: Config) -> tuple[str, int] | None:
    """Use Podcastfy to generate conversational podcast from post content.

    Returns (audio_path, duration_secs) or None on failure.
    audio_path is relative to the backend/ directory (e.g., "audio/uber_42.mp3").
    """
    try:
        from podcastfy.client import generate_podcast
    except ImportError:
        logger.error("podcastfy not installed. Run: pip install podcastfy")
        return None

    audio_dir = Path(__file__).parent.parent.parent / config.app.get("audio_dir", "audio")
    audio_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{post.source_key}_{post.id}.mp3"
    output_path = audio_dir / filename

    try:
        conversation_config = _get_conversation_config(config)

        # Prefer passing the URL so Podcastfy can fetch context itself,
        # but fall back to text if URL fails
        kwargs = {
            "conversation_config": conversation_config,
            "tts_model": config.podcast.get("tts_model", "openai"),
            "llm_model_name": config.podcast.get("llm_model", "gpt-4o"),
        }

        if post.url:
            kwargs["urls"] = [post.url]
        elif post.full_text:
            kwargs["text"] = post.full_text
        else:
            logger.warning(f"Post {post.id} has no URL or full_text, skipping")
            return None

        # generate_podcast returns path to the generated audio file
        result_path = generate_podcast(**kwargs)

        if result_path and Path(result_path).exists():
            # Move the generated file to our audio directory
            if str(result_path) != str(output_path):
                shutil.move(str(result_path), str(output_path))

            # Get duration using mutagen if available, otherwise estimate
            duration = _get_audio_duration(output_path)
            relative_path = f"audio/{filename}"
            logger.info(f"Generated podcast for post {post.id}: {relative_path} ({duration}s)")
            return relative_path, duration
        else:
            logger.error(f"Podcastfy returned no output for post {post.id}")
            return None

    except Exception as e:
        logger.error(f"Failed to generate podcast for post {post.id}: {e}")
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
