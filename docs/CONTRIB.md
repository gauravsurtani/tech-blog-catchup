# Contributing Guide

## Prerequisites

| Tool       | Version | Check                |
|------------|---------|----------------------|
| Python     | 3.11+   | `python --version`   |
| Node.js    | 22+     | `node --version`     |
| ffmpeg     | any     | `ffmpeg -version`    |
| Git        | any     | `git --version`      |

## Environment Setup

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
crawl4ai-setup            # installs Playwright Chromium
cp .env.example .env      # then add your OPENAI_API_KEY
python run.py init        # create DB + seed tags
```

### Frontend

```bash
cd frontend
npm install
```

### Environment Variables

| Variable              | Required     | Default                              | Purpose                          |
|-----------------------|--------------|--------------------------------------|----------------------------------|
| `OPENAI_API_KEY`      | For podcasts | --                                   | GPT-4o script gen + OpenAI TTS   |
| `CORS_ORIGINS`        | Production   | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed origins |
| `NEXT_PUBLIC_API_URL` | Production   | `http://localhost:8000`              | Backend URL for frontend         |
| `FIRECRAWL_API_KEY`   | Optional     | --                                   | Firecrawl extraction fallback    |

## Available Scripts

### Backend CLI (from `backend/`)

| Command                                              | Description                                      |
|------------------------------------------------------|--------------------------------------------------|
| `python run.py init`                                 | Create SQLite DB + seed 12 tag categories        |
| `python run.py crawl --source cloudflare`            | Crawl one source (smart: sitemap+RSS+scrape)     |
| `python run.py crawl --max-posts 10`                 | Smart crawl all sources, cap at 10 per source    |
| `python run.py crawl --dry-run`                      | Discover URLs without extracting                 |
| `python run.py discover`                             | URL discovery report for all sources             |
| `python run.py discover --source uber`               | Discovery report for one source                  |
| `python run.py generate --post-id 42`                | Generate podcast for specific post               |
| `python run.py generate --limit 5`                   | Generate up to 5 podcasts                        |
| `python run.py reextract --source github --quality-below 40 --dry-run` | Re-extract low-quality posts    |
| `python run.py regenerate --source meta --dry-run`   | Regenerate summaries/scripts                     |
| `python run.py status`                               | Post counts, audio stats, tag distribution       |
| `python run.py api --reload`                         | FastAPI dev server on :8000                      |
| `python run.py serve`                                | Alias for api                                    |

### Frontend Scripts (from `frontend/`)

| Command           | Description                               |
|-------------------|-------------------------------------------|
| `npm run dev`     | Next.js dev server on :3000               |
| `npm run build`   | Production build (standalone output)      |
| `npm run start`   | Start production server                   |
| `npm run lint`    | ESLint                                    |

### Docker

```bash
cp backend/.env.example backend/.env   # add OPENAI_API_KEY
docker-compose up --build              # frontend :3000, backend :8000
```

## Development Workflow

1. **Create a branch** from the main development branch
2. **Read before write** -- always verify current state of files before editing
3. **Run tests** after every change:
   ```bash
   cd backend && pytest tests/ -v          # 161+ tests, must all pass
   cd frontend && npm run build            # must compile without errors
   ```
4. **Commit** with conventional commit format: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## Testing

### Backend (pytest)

```bash
cd backend
pip install -e ".[dev]"
pytest tests/ -v                          # all tests
pytest tests/test_config.py -v            # single file
pytest tests/ -k "test_crawl"             # by keyword
```

Config: `asyncio_mode = "auto"` in `pyproject.toml`.

Key test files:
- `test_api.py` -- API endpoints (client fixture patches `init_db` AND `recover_stuck_processing`)
- `test_crawl_manager.py` -- Crawl pipeline with mocked discovery
- `test_extractor*.py` -- Content extraction strategies
- `test_circuit_breaker.py`, `test_feed_discoverer.py` -- Resilience modules

### Frontend (Playwright E2E)

```bash
cd frontend
npx playwright install
npx playwright test
```

Page objects pattern at `frontend/e2e/`.

## Code Conventions

- **Python**: Type hints, `logging` (not print), SQLAlchemy ORM, dataclasses for config
- **TypeScript**: Strict mode, interfaces in `lib/types.ts`, API client in `lib/api.ts`
- **Config**: All source/tag/crawl config in `backend/config.yaml` -- never hardcode
- **Immutability**: Prefer creating new objects over mutation
- **File size**: Keep under 800 lines, extract helpers for large modules

## Architecture Quick Reference

```
config.yaml --> Crawler (Crawl4AI + RSS + sitemap + blog page pagination)
                  |
                  v
                SQLite (SQLAlchemy ORM: Post, Tag, CrawlLog, Job)
                  |
                  v
                FastAPI REST API (:8000) + static audio serving
                  |
                  v
                Next.js 16 + React 19 (:3000) with persistent audio player
```

### Crawl Pipeline

```
discover_urls()           # sitemap + Medium archive + blog page + RSS
  -> _filter_junk_urls()  # regex-based removal of non-article URLs
  -> filter_new_urls()   # deduplicate against DB
  -> extract_articles_batch()  # LLM -> Trafilatura -> BS4 fallback chain
  -> _store_extraction_result()  # commit to DB with quality scoring
```

### Per-Source Discovery Strategies

| Source   | Strategy         | Key Config                        |
|----------|------------------|-----------------------------------|
| Uber     | Blog page + pagination | `pagination_pattern: "/page/{n}/"` |
| Meta     | Sitemap + dedup  | Child sitemaps deduplicated        |
| Airbnb   | Medium archive + scroll | `platform: "medium"`, scroll JS  |
| Netflix  | Medium archive + scroll | Same as Airbnb                   |
| Others   | Sitemap + RSS    | Standard discovery                 |
