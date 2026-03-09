"""FastAPI application setup."""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from src.api.rate_limit import limiter
from src.api.routes import router
from src.database import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Recover posts stuck in "processing" from previous crashes
    try:
        from src.podcast.manager import recover_stuck_processing
        from src.database import get_session
        session = get_session()
        try:
            recovered = recover_stuck_processing(session)
            if recovered:
                import logging
                logging.getLogger(__name__).info(f"Recovered {recovered} stuck posts on startup")
        finally:
            session.close()
    except Exception:
        pass  # Recovery is best-effort; don't block startup
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tech Blog Catchup",
        description="Scrape tech blogs, convert to conversational podcasts",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS — configurable via CORS_ORIGINS env var (comma-separated)
    origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    allowed_origins = [o.strip() for o in origins if o.strip()]
    logger.info("CORS allowed origins: %s", allowed_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount audio directory for serving MP3 files
    env_audio_dir = os.getenv("AUDIO_DIR")
    if env_audio_dir:
        audio_dir = Path(env_audio_dir)
    else:
        audio_dir = Path(__file__).parent.parent.parent / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Serving audio from: %s", audio_dir.resolve())
    app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

    # Include API routes
    app.include_router(router)

    return app


app = create_app()
