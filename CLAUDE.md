# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

Tech Blog Catchup scrapes 15 top tech engineering blogs, converts posts into NotebookLM-style conversational podcasts (two AI hosts via GPT-4o + OpenAI TTS), and serves a Spotify-like web player for browsing, filtering, and playlist management.

## Build & Run Commands

### Backend (Python 3.11+, from `backend/` directory)

```bash
# Setup
python -m venv .venv && source .venv/bin/activate
pip install -e .
crawl4ai-setup          # installs Playwright Chromium for JS-rendered crawling

# CLI (all from backend/)
python run.py init                        # create SQLite DB + seed 12 tag categories
python run.py crawl --source cloudflare   # crawl one source (incremental RSS)
python run.py crawl --max-posts 10        # smart crawl all sources, cap at 10 per source
python run.py generate --post-id 42       # podcast for one post
python run.py reextract --source github --quality-below 40 --dry-run
python run.py regenerate --source meta --dry-run
python run.py status                      # post counts, audio stats, tag distribution
python run.py api --reload                # FastAPI on :8000 with hot-reload

# Tests
pip install -e ".[dev]"
pytest tests/ -v                          # all tests
pytest tests/test_config.py -v            # single test file
```

### Frontend (Node 22+, from `frontend/` directory)

```bash
npm install
npm run dev       # Next.js dev server on :3000
npm run build     # production build (standalone output)
npm run lint      # ESLint
```

### Docker (full stack)

```bash
cp backend/.env.example backend/.env   # add OPENAI_API_KEY
docker-compose up --build              # frontend :3000, backend :8000, Swagger :8000/docs
```

## Architecture

```
config.yaml ──> Crawler (Crawl4AI + atoma RSS) ──> SQLite (SQLAlchemy ORM)
                Auto-Tagger (keyword matching)          │
                Podcast Generator (GPT-4o + TTS)        │
                                                        v
                                                  FastAPI REST API (:8000)
                                                        │
                                                  Next.js 16 + React 19 (:3000)
                                                  (Tailwind CSS 4, dark theme)
```

### Backend (`backend/src/`)

- **`config.py`** — Loads `config.yaml` into typed dataclasses (`BlogSource`, `TagDefinition`, `Config`). Singleton via `get_config()` with `@lru_cache`.
- **`database.py`** — SQLAlchemy engine/session factory for SQLite at `data/techblog.db`. Module-level singletons (`_engine`, `_session_factory`). `reset_engine()` exists for testing.
- **`models.py`** — Four ORM models: `Post` (the core entity), `Tag` (12 categories), `CrawlLog`, `Job` (async task tracking). Many-to-many `post_tags` association table links Post and Tag.
- **`api/`** — FastAPI app with CORS (configurable via `CORS_ORIGINS` env var). Routes are prefixed `/api`. Rate limiting via `slowapi` in `rate_limit.py`. POST `/api/crawl` and `/api/generate` run as `BackgroundTasks` (non-blocking), returning a `job_id` for tracking via `/api/jobs/{id}`. Static audio served at `/audio/{filename}`.
- **`crawler/`** — Unified smart-crawl via `crawl_manager.py`: discovers URLs (sitemap + Medium archive + blog page scrape + RSS), filters junk URLs, deduplicates against DB, extracts via pipeline. `circuit_breaker.py` provides per-domain failure tracking (CLOSED/OPEN/HALF_OPEN). `feed_discoverer.py` auto-discovers RSS/Atom feeds via HTML link tags + path probing.
- **`podcast/`** — `manager.py` selects pending posts, `generator.py` produces script via GPT-4o then audio via OpenAI TTS. Output goes to `backend/audio/`.
- **`tagger/auto_tagger.py`** — Keyword-matching against 12 tag categories defined in `config.yaml`.

### Frontend (`frontend/src/`)

- **App Router** (Next.js 16): pages at `app/page.tsx`, `app/explore/page.tsx`, `app/playlist/page.tsx`, `app/post/[id]/page.tsx`.
- **Global audio player** — `AudioPlayerProvider` context in `hooks/useAudioPlayer.tsx` wraps the entire app via `layout.tsx`. Persistent `<audio>` element with queue/history/seek/volume/playbackRate state. The `AudioPlayer` component renders as a fixed bottom bar with speed control (0.5x-3x) and keyboard shortcuts (Space=play/pause, M=mute).
- **API client** — `lib/api.ts` talks to `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`). Includes retry logic (3 attempts, exponential backoff), timeout (10s), and `ApiError` class. All types in `lib/types.ts`.
- **Standalone output** — `next.config.ts` sets `output: "standalone"` for Docker deployment.

## Key Conventions

- **All CLI commands** run from `backend/` via `python run.py <command>`.
- **Config is centralized** in `backend/config.yaml` — sources, tags, podcast settings, crawl rate limits, app paths.
- **Environment variables**: `OPENAI_API_KEY` (for podcast generation), `CORS_ORIGINS` (comma-separated), `NEXT_PUBLIC_API_URL` (frontend's backend URL).
- **Database** is SQLite, auto-created at `backend/data/techblog.db`. Both `data/` and `audio/` directories are gitignored.
- **Post.audio_status** lifecycle: `pending` -> `processing` -> `ready` | `failed`.
- **Crawl mode**: Unified "smart" crawl discovers via all methods (sitemap, Medium archive, blog page, RSS), deduplicates, filters junk URLs, extracts. Use `--max-posts N` to cap per source.
- **Junk URL filter**: `_filter_junk_urls()` in `crawl_manager.py` removes non-article URLs (images, signin, help, archive listings, etc.) before extraction. Extraction capped at 3x `max_posts` to save API credits.
- **Quality gate**: Podcast generation only selects posts with `quality_score >= 60` or `NULL` (legacy).
- **pytest** uses `asyncio_mode = "auto"` (configured in `pyproject.toml`).
- **Job.status** lifecycle: `queued` -> `running` -> `completed` | `failed`.
- **Rate limiting**: 5 requests/minute on `/api/crawl` and `/api/generate` via `slowapi`.
- **E2E tests** use Playwright at `frontend/e2e/` with page object pattern. Run: `cd frontend && npx playwright test`.
- **Keyboard shortcuts**: `Space` = play/pause, `M` = mute/unmute (when audio player is active).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts` | Paginated posts (filter: source, tag, search, audio_status, quality_min, sort) |
| GET | `/api/posts/{id}` | Post detail with full_text |
| GET | `/api/tags` | All tags with post counts |
| GET | `/api/sources` | All sources with post counts |
| GET | `/api/playlist` | Posts with audio_status=ready only |
| GET | `/api/status` | Dashboard summary |
| GET | `/api/health` | Health check with uptime, DB status, version |
| GET | `/api/jobs` | List background jobs (filter: job_type, status) |
| GET | `/api/jobs/{id}` | Single job detail |
| POST | `/api/crawl` | Trigger crawl (rate limited: 5/min) |
| POST | `/api/generate` | Trigger podcast generation (rate limited: 5/min) |
