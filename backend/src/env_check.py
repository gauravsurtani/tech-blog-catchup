"""Startup environment validation and feature detection."""

import logging
import os

logger = logging.getLogger(__name__)


def validate_environment() -> dict:
    """Check environment variables and return feature status.

    Called at startup to log which capabilities are enabled/disabled.
    """
    warnings: list[str] = []

    openai_key = os.getenv("OPENAI_API_KEY")
    nextauth_secret = os.getenv("NEXTAUTH_SECRET")
    scheduler_enabled = os.getenv("ENABLE_SCHEDULER", "").lower() in ("true", "1", "yes")
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    audio_dir = os.getenv("AUDIO_DIR", "(default: backend/audio/)")
    site_url = os.getenv("SITE_URL", "http://localhost:3000")

    generation_enabled = bool(openai_key)
    auth_enabled = bool(nextauth_secret)

    if not openai_key:
        warnings.append("OPENAI_API_KEY not set — podcast generation will be disabled")
    if not nextauth_secret:
        warnings.append("NEXTAUTH_SECRET not set — user authentication will be disabled")

    status = {
        "auth_enabled": auth_enabled,
        "generation_enabled": generation_enabled,
        "scheduler_enabled": scheduler_enabled,
        "site_url": site_url,
        "warnings": warnings,
    }

    banner = [
        "",
        "╔══════════════════════════════════════════╗",
        "║       Tech Blog Catchup — Startup        ║",
        "╠══════════════════════════════════════════╣",
        f"║  Auth:       {'✓ enabled' if auth_enabled else '✗ disabled':>28s} ║",
        f"║  Generation: {'✓ enabled' if generation_enabled else '✗ disabled':>28s} ║",
        f"║  Scheduler:  {'✓ enabled' if scheduler_enabled else '✗ disabled':>28s} ║",
        "╠══════════════════════════════════════════╣",
        f"║  CORS:       {cors_origins[:28]:>28s} ║",
        f"║  Audio dir:  {audio_dir[:28]:>28s} ║",
        f"║  Site URL:   {site_url[:28]:>28s} ║",
        "╚══════════════════════════════════════════╝",
        "",
    ]
    for line in banner:
        logger.info(line)

    for w in warnings:
        logger.warning("⚠  %s", w)

    return status
