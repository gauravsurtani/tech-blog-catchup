"""FastAPI application setup."""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.api.routes import router
from src.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tech Blog Catchup",
        description="Scrape tech blogs, convert to conversational podcasts",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS — configurable via CORS_ORIGINS env var (comma-separated)
    origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount audio directory for serving MP3 files
    audio_dir = Path(__file__).parent.parent.parent / "audio"
    audio_dir.mkdir(exist_ok=True)
    app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

    # Include API routes
    app.include_router(router)

    return app


app = create_app()
