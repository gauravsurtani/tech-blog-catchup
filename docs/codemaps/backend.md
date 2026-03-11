# Backend Codemap

> Freshness: 2026-02-15 | Auto-generated from source analysis

## Module Tree (36 files)

```
backend/src/
├── config.py              # BlogSource, TagDefinition, Config, get_config()
├── database.py            # init_db(), get_session(), reset_engine()
├── models.py              # Post, Tag, CrawlLog, Job, post_tags
│
├── api/
│   ├── app.py             # create_app(), lifespan (init_db + recover_stuck)
│   ├── routes.py          # 13 endpoints under /api prefix
│   ├── schemas.py         # 10 Pydantic models
│   └── rate_limit.py      # slowapi limiter (5/min on crawl/generate)
│
├── crawler/
│   ├── crawl_manager.py   # discover_urls(), crawl_source(), crawl_all()
│   ├── sitemap_parser.py  # parse_sitemap() + scrape_medium_archive_urls()
│   ├── feed_parser.py     # parse_feed() -> FeedEntry (via atoma)
│   ├── feed_discoverer.py # discover_feeds() (async HTML + path probing)
│   └── circuit_breaker.py # DomainCircuit, CircuitBreaker (CLOSED/OPEN/HALF_OPEN)
│
├── extractor/
│   ├── __init__.py        # re-export hub
│   ├── types.py           # QualityResult, ExtractionResult (frozen)
│   ├── pipeline.py        # extract_article(), extract_articles_batch()
│   ├── quality_scorer.py  # score_content() -> 0-100
│   ├── content_cleaner.py # clean_html(), clean_markdown(), strip_html_tags()
│   ├── content_generator.py # generate_content() (GPT-4o -> summary + script)
│   ├── content_scanner.py # is_useful_content() (LLM classifier)
│   ├── html_to_markdown.py# html_to_markdown() (custom MarkdownConverter)
│   ├── summarizer.py      # extract_summary() (first paragraph)
│   └── strategies/
│       ├── base.py        # ExtractionStrategy (ABC)
│       ├── trafilatura_strategy.py  # Tier 1 (F1=0.958)
│       ├── crawl4ai_strategy.py     # Tier 1 (JS-rendered)
│       ├── bs4_strategy.py          # Tier 2 (fallback)
│       ├── llm_strategy.py          # Tier 2 (GPT-4o)
│       ├── firecrawl.py             # Tier 3 (API key required)
│       └── jina.py                  # Tier 4 (free)
│
├── podcast/
│   ├── manager.py         # generate_pending(), generate_for_post()
│   └── generator.py       # generate_podcast_for_post() (TTS synthesis)
│
└── tagger/
    └── auto_tagger.py     # ensure_tags_exist(), auto_tag_post()
```

## Dependency Graph (simplified)

```
config.py ←── database.py ←── models.py
    ↑              ↑              ↑
    |              |              |
    ├── api/app.py ├── api/routes.py
    |              |
    ├── crawler/crawl_manager.py ←── sitemap_parser.py
    |   └── uses: feed_parser.py      feed_discoverer.py
    |                                  circuit_breaker.py
    |
    ├── extractor/pipeline.py ←── strategies/*
    |   └── uses: quality_scorer, content_cleaner,
    |             html_to_markdown, content_generator,
    |             content_scanner, summarizer
    |
    ├── podcast/manager.py ←── generator.py
    |
    └── tagger/auto_tagger.py
```

## API Endpoints (13 routes)

| Method | Path               | Handler           | Rate Limited |
|--------|--------------------|-------------------|--------------|
| GET    | /api/posts         | list_posts()      | No           |
| GET    | /api/posts/{id}    | get_post()        | No           |
| GET    | /api/tags          | list_tags()       | No           |
| GET    | /api/sources       | list_sources()    | No           |
| GET    | /api/playlist      | get_playlist()    | No           |
| GET    | /api/status        | get_status()      | No           |
| GET    | /api/health        | health()          | No           |
| GET    | /api/crawl-status  | crawl_status()    | No           |
| GET    | /api/jobs          | list_jobs()       | No           |
| GET    | /api/jobs/{id}     | get_job()         | No           |
| POST   | /api/crawl         | trigger_crawl()   | 5/min        |
| POST   | /api/generate      | trigger_generate()| 5/min        |

## CLI Commands (run.py)

| Command      | Function         | Key Imports                          |
|--------------|------------------|--------------------------------------|
| init         | cmd_init()       | database, config, tagger             |
| crawl        | cmd_crawl()      | crawl_manager, tagger                |
| discover     | cmd_discover()   | crawl_manager (discover_urls only)   |
| generate     | cmd_generate()   | podcast.manager                      |
| status       | cmd_status()     | models (Post, Tag)                   |
| reextract    | cmd_reextract()  | extractor, tagger                    |
| regenerate   | cmd_regenerate() | extractor.content_generator          |
| api          | cmd_api()        | uvicorn                              |
| serve        | cmd_serve()      | uvicorn                              |

## Extraction Strategy Chain

```
needs_browser=True:   Crawl4AI -> LLM -> Trafilatura -> BS4
needs_browser=False:  LLM -> Trafilatura -> BS4
Tier 3 (optional):    Firecrawl (FIRECRAWL_API_KEY)
Tier 4 (fallback):    Jina Reader (free)
```
