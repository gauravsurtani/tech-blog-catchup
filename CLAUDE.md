# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

Tech Blog Catchup scrapes 15 top tech engineering blogs, converts posts into NotebookLM-style conversational podcasts (two AI hosts via LLM + OpenAI TTS), and serves a Spotify-like web player for browsing, filtering, and playlist management.

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
python run.py discover                    # URL discovery report (all sources, no extraction)
python run.py discover --source uber      # discover for one source only
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
                Podcast Generator (LLM + TTS)        │
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
- **`crawler/`** — Unified smart-crawl via `crawl_manager.py`: discovers URLs (sitemap + Medium archive + blog page scrape with pagination + RSS), filters junk URLs, deduplicates against DB, extracts via pipeline. Blog page scraper supports `pagination_pattern` (e.g. `/page/{n}/` for Uber) to follow paginated listing pages. Medium archive scraper scrolls to load lazy content. `sitemap_parser.py` deduplicates across child sitemaps. `circuit_breaker.py` provides per-domain failure tracking (CLOSED/OPEN/HALF_OPEN). `feed_discoverer.py` auto-discovers RSS/Atom feeds via HTML link tags + path probing.
- **`podcast/`** — `manager.py` selects pending posts, `generator.py` produces script via LLM then audio via OpenAI TTS. Output goes to `backend/audio/`.
- **`tagger/auto_tagger.py`** — Keyword-matching against 12 tag categories defined in `config.yaml`.

### Frontend (`frontend/src/`)

- **App Router** (Next.js 16): pages at `app/page.tsx`, `app/explore/page.tsx`, `app/playlist/page.tsx`, `app/post/[id]/page.tsx`.
- **Page differentiation**: Home (`/`) = "Your Podcast Feed" showing only `audio_status=ready` posts with a pending count footer linking to Explore. Explore (`/explore`) = all posts with search, source/tag filters, sort, pagination, and generate buttons for pending/failed posts.
- **Global audio player** — `AudioPlayerProvider` context in `hooks/useAudioPlayer.tsx` wraps the entire app via `layout.tsx`. Persistent `<audio>` element with queue/history/seek/volume/playbackRate state. The `AudioPlayer` component renders as a fixed bottom bar with speed control (0.5x-3x) and keyboard shortcuts (Space=play/pause, M=mute, ArrowLeft/Right=seek, ArrowUp/Down=volume).
- **Generation status** — `hooks/useGenerationStatus.ts` polls `/api/jobs?job_type=generate&status=running` every 5s. `GenerationBanner` component in `layout.tsx` shows a global indigo bar when a generate job is running. `usePosts` hook supports optional `refetchInterval` for auto-refresh during generation.
- **Generate Podcast buttons** — Post detail, PostListItem (Home), and PostCard (Explore) all show "Generate Podcast" for posts with `audio_status` of `pending` or `failed`. User sees no distinction between pending and failed — just a post without audio and one action to create it.
- **API client** — `lib/api.ts` talks to `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`). Includes retry logic (3 attempts, exponential backoff), timeout (10s), `ApiError` class, and `getJobs()` helper. All types in `lib/types.ts` (including `Job` interface).
- **Standalone output** — `next.config.ts` sets `output: "standalone"` for Docker deployment.

## Key Conventions

- **All CLI commands** run from `backend/` via `python run.py <command>`.
- **Config is centralized** in `backend/config.yaml` — sources, tags, podcast settings, crawl rate limits, app paths.
- **Environment variables**: `OPENAI_API_KEY` (for podcast generation), `CORS_ORIGINS` (comma-separated), `NEXT_PUBLIC_API_URL` (frontend's backend URL).
- **Database** is SQLite, auto-created at `backend/data/techblog.db`. Both `data/` and `audio/` directories are gitignored.
- **Post.audio_status** lifecycle: `pending` -> `processing` -> `ready` | `failed`.
- **Crawl mode**: Unified "smart" crawl discovers via all methods (sitemap, Medium archive, blog page, RSS), deduplicates, filters junk URLs, extracts. Use `--max-posts N` to cap per source.
- **Pagination**: `BlogSource.pagination_pattern` (e.g. `"/page/{n}/"`) enables multi-page blog scraping. Uber uses this to discover ~530 URLs across 44 pages.
- **Junk URL filter**: `_filter_junk_urls()` in `crawl_manager.py` removes non-article URLs (images, signin, help, archive listings, etc.) before extraction. Extraction capped at 3x `max_posts` to save API credits.
- **Quality gate**: Podcast generation only selects posts with `quality_score >= 60` or `NULL` (legacy).
- **pytest** uses `asyncio_mode = "auto"` (configured in `pyproject.toml`).
- **Job.status** lifecycle: `queued` -> `running` -> `completed` | `failed`.
- **Rate limiting**: 5 requests/minute on `/api/crawl` and `/api/generate` via `slowapi`.
- **Duplicate job guard**: `POST /api/generate` returns 409 if the target post already has audio (`ready`), or if an identical job (same `post_id` or batch) is already `queued`/`running`.
- **Generate batch limit**: Default `limit=10` posts per generate job. Frontend doesn't override this.
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
| GET | `/api/crawl-status` | Per-source scrape status with total_discoverable |
| GET | `/api/jobs` | List background jobs (filter: job_type, status) |
| GET | `/api/jobs/{id}` | Single job detail |
| POST | `/api/crawl` | Trigger crawl (rate limited: 5/min) |
| POST | `/api/generate` | Trigger podcast generation (rate limited: 5/min, 409 on duplicate/existing audio) |
