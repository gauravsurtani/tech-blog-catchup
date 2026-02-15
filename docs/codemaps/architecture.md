# Architecture Codemap

> Freshness: 2026-02-15 | Auto-generated from source analysis

## System Overview

```
config.yaml ──> Crawler ──> SQLite ──> FastAPI ──> Next.js
                  |            |          |           |
                  v            v          v           v
              Extractor    Models     REST API    React UI
              Pipeline     (ORM)     (:8000)     (:3000)
                  |
                  v
              Podcast Gen
              (GPT-4o + TTS)
```

## Layer Boundaries

| Layer        | Tech               | Entry Point                | Port  |
|--------------|--------------------|----------------------------|-------|
| Config       | YAML + dataclasses | `src.config.get_config()`  | --    |
| Database     | SQLAlchemy + SQLite| `src.database.init_db()`   | --    |
| Crawler      | Crawl4AI + atoma   | `crawl_manager.crawl_source()` | --  |
| Extractor    | Trafilatura + LLM  | `extractor.extract_article()` | --  |
| Podcast      | OpenAI GPT-4o + TTS| `podcast.manager.generate_pending()` | -- |
| API          | FastAPI            | `src.api.app:app`          | 8000  |
| Frontend     | Next.js 16 + React | `next dev`                 | 3000  |

## Data Flow

```
1. DISCOVER   config.yaml -> discover_urls() -> [URLs]
              (sitemap + Medium archive + blog page + RSS)

2. FILTER     [URLs] -> _filter_junk_urls() -> filter_new_urls() -> [new URLs]

3. EXTRACT    [new URLs] -> extract_articles_batch() -> [ExtractionResult]
              (LLM -> Trafilatura -> BS4 fallback chain)

4. STORE      [ExtractionResult] -> Post records -> SQLite
              (quality scoring, auto-tagging)

5. GENERATE   Post (quality>=60) -> GPT-4o script -> OpenAI TTS -> MP3

6. SERVE      SQLite -> FastAPI REST -> Next.js UI
```

## Key Singletons

| Singleton           | Module            | Pattern             |
|---------------------|-------------------|---------------------|
| Config              | `config.py`       | `@lru_cache`        |
| DB Engine           | `database.py`     | Module-level `_engine` |
| Rate Limiter        | `rate_limit.py`   | Module-level `limiter` |
| FastAPI App         | `api/app.py`      | `create_app()`      |

## Async Boundaries

- **Crawler**: `asyncio.run()` wraps Crawl4AI browser operations
- **Extractor**: Fully async pipeline, batch with `asyncio.gather()`
- **API**: FastAPI `BackgroundTasks` for crawl/generate (non-blocking)
- **Frontend**: Client-side fetch with retry logic

## External Dependencies

| Service      | Used By           | Required | Env Var             |
|--------------|-------------------|----------|---------------------|
| OpenAI API   | Extractor, Podcast| Optional | `OPENAI_API_KEY`    |
| Firecrawl    | Extractor (Tier3) | Optional | `FIRECRAWL_API_KEY` |
| Jina Reader  | Extractor (Tier4) | No       | --                  |
