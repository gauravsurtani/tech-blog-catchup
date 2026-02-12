"""FastAPI application setup."""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.api.routes import router
from src.database import init_db


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tech Blog Catchup",
        description="Scrape tech blogs, convert to conversational podcasts",
        version="0.1.0",
    )

    # CORS for Next.js frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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

    @app.on_event("startup")
    def startup():
        init_db()

    return app


app = create_app()
