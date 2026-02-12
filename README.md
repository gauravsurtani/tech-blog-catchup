# Tech Blog Catchup

Stay current with top tech company engineering blogs without reading them.

Tech Blog Catchup scrapes full archives of 15 top tech engineering blogs, converts posts into NotebookLM-style conversational podcasts (two AI hosts), and provides a web app for browsing, filtering, and playlist management. Think of it as a personalized podcast feed generated from the best engineering content on the internet.

## Architecture

```
                        +---------------------+
                        |    config.yaml      |
                        | (sources, tags,     |
                        |  podcast settings)  |
                        +----------+----------+
                                   |
          +------------------------+------------------------+
          |                        |                        |
  +-------v--------+    +---------v---------+    +---------v---------+
  |    Crawler      |    |   Auto-Tagger     |    | Podcast Generator |
  | Crawl4AI +      |    | Keyword-based     |    | Podcastfy +       |
  | sitemaps (full) |    | categorization    |    | GPT-4o script +   |
  | RSS (incremental)|   | (12 categories)   |    | OpenAI TTS        |
  +-------+--------+    +---------+---------+    +---------+---------+
          |                        |                        |
          +------------------------+------------------------+
                                   |
                        +----------v----------+
                        |    SQLite Database   |
                        |  (posts, tags,       |
                        |   crawl logs)        |
                        +----------+----------+
                                   |
                        +----------v----------+
                        |   FastAPI Backend    |
                        |   REST API (:8000)   |
                        |   + static audio     |
                        +----------+----------+
                                   |
                        +----------v----------+
                        |   Next.js Frontend   |
                        |   React + Tailwind   |
                        |   Web Player (:3000) |
                        +-----------------------+
```

| Layer              | Technology                                       |
| ------------------ | ------------------------------------------------ |
| Backend API        | FastAPI (Python 3.11+) with SQLite via SQLAlchemy |
| Frontend           | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Crawler            | Crawl4AI (sitemaps) + atoma (RSS/Atom feeds)     |
| Podcast Generation | Podcastfy + OpenAI GPT-4o (script) + OpenAI TTS  |
| Auto-Tagging       | Keyword-based categorization (12 tag categories) |

## Supported Blogs

| #  | Source      | Blog Name              |
| -- | ---------- | ---------------------- |
| 1  | Uber       | Uber Engineering       |
| 2  | Airbnb     | Airbnb Tech Blog       |
| 3  | Meta       | Meta Engineering       |
| 4  | AWS        | AWS Architecture       |
| 5  | Discord    | Discord Engineering    |
| 6  | Netflix    | Netflix TechBlog       |
| 7  | Google     | Google Research        |
| 8  | NVIDIA     | NVIDIA Developer       |
| 9  | Cloudflare | Cloudflare Blog        |
| 10 | Slack      | Slack Engineering      |
| 11 | Figma      | Figma Tech Blog        |
| 12 | Shopify    | Shopify Engineering    |
| 13 | Stripe     | Stripe Engineering     |
| 14 | Microsoft  | Microsoft DevBlogs     |
| 15 | GitHub     | GitHub Engineering     |

All sources are configured in `backend/config.yaml` and can be enabled/disabled individually.

## Features

- **Full archive crawling** -- Scrapes entire blog history via sitemaps using Crawl4AI's headless browser
- **Incremental updates** -- Fetches only new posts via RSS/Atom feeds for fast daily updates
- **Auto-tagging** -- Categorizes every post into 12 topic tags using keyword matching
- **NotebookLM-style podcast generation** -- Converts articles into engaging two-host conversational audio using GPT-4o for scripting and OpenAI TTS for voices
- **Spotify-like web player** -- Persistent audio bar that continues playing as you navigate
- **Browse, filter, and search** -- Filter posts by source, tag, date; full-text title search
- **Playlist builder and queue management** -- Build custom listening queues from any filtered view
- **CLI for all operations** -- Initialize, crawl, generate podcasts, check status, and start servers from the command line

## Tag Categories

Posts are automatically categorized into these 12 tags:

Generative AI, LLMs, Fine Tuning, Infrastructure, Data Engineering, Frontend, Mobile, Security, ML/AI, DevOps, Databases, Distributed Systems

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **ffmpeg** (required for podcast audio generation)
- **OpenAI API key** (required for podcast script generation and TTS)

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd tech-blog-catchup
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .

# Install headless browser for Crawl4AI
crawl4ai-setup

# Configure your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Initialize the database

```bash
python run.py init
```

This creates the SQLite database at `data/techblog.db` and seeds the 12 tag categories.

### 4. Start crawling

```bash
# Start with one blog to test
python run.py crawl --source cloudflare

# Crawl all 15 blogs (incremental mode, RSS feeds)
python run.py crawl

# Full archive crawl via sitemaps (slower, gets everything)
python run.py crawl --mode full
```

### 5. Generate podcasts (optional)

```bash
# Generate podcasts for up to 10 pending posts
python run.py generate

# Generate for a specific post
python run.py generate --post-id 42
```

### 6. Start the API server

```bash
python run.py api
```

The backend will be available at `http://localhost:8000`.

### 7. Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## CLI Reference

All commands are run from the `backend/` directory.

| Command                                          | Description                                    |
| ------------------------------------------------ | ---------------------------------------------- |
| `python run.py init`                             | Initialize database and create tag categories  |
| `python run.py crawl`                            | Crawl all enabled blogs (incremental mode)     |
| `python run.py crawl --source cloudflare`        | Crawl a specific blog only                     |
| `python run.py crawl --mode full`                | Full archive crawl via sitemaps                |
| `python run.py crawl --mode incremental`         | Incremental crawl via RSS feeds (default)      |
| `python run.py generate`                         | Generate podcasts for up to 10 pending posts   |
| `python run.py generate --limit 50`              | Generate podcasts with custom limit            |
| `python run.py generate --post-id 42`            | Generate podcast for a specific post           |
| `python run.py status`                           | Show post counts, audio stats, tag distribution|
| `python run.py api`                              | Start FastAPI server on port 8000              |
| `python run.py api --port 9000`                  | Start API server on custom port                |
| `python run.py api --reload`                     | Start API server with auto-reload              |
| `python run.py serve`                            | Start the backend server                       |

Add `-v` / `--verbose` to any command for debug-level logging.

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint             | Description                                     | Key Parameters                                                |
| ------ | -------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| GET    | `/api/posts`         | List posts with pagination, filtering, sorting  | `source`, `tag`, `search`, `audio_status`, `offset`, `limit`, `sort` |
| GET    | `/api/posts/{id}`    | Get full post detail including text and audio    | --                                                            |
| GET    | `/api/tags`          | List all tags with post counts                  | --                                                            |
| GET    | `/api/sources`       | List all sources with post counts               | --                                                            |
| GET    | `/api/playlist`      | List posts with audio ready (filterable)        | `source`, `tag`, `search`, `offset`, `limit`, `sort`          |
| POST   | `/api/crawl`         | Trigger a crawl run                             | Body: `{ "source": "...", "mode": "incremental" }`            |
| POST   | `/api/generate`      | Trigger podcast generation                      | Body: `{ "post_id": 42, "limit": 10 }`                       |
| GET    | `/api/status`        | System status: post counts, audio stats, tags   | --                                                            |
| GET    | `/audio/{filename}`  | Serve generated podcast MP3 files (static)      | --                                                            |

### Pagination

The `GET /api/posts` and `GET /api/playlist` endpoints support pagination:

- `offset` -- Number of posts to skip (default: 0)
- `limit` -- Number of posts to return (default: 20, max: 100)
- `sort` -- Sort field, prefix with `-` for descending (default: `-published_at`)

### Filtering

- `source` -- Filter by source key (e.g., `cloudflare`, `netflix`)
- `tag` -- Filter by tag name (e.g., `Infrastructure`, `LLMs`)
- `search` -- Search post titles (case-insensitive substring match)
- `audio_status` -- Filter by audio status (`pending`, `ready`, `failed`)

## Configuration

All project settings live in `backend/config.yaml`:

- **sources** -- Blog definitions (name, feed URL, sitemap URL, URL patterns, enabled flag)
- **tags** -- 12 tag categories with keyword lists for auto-tagging
- **podcast** -- LLM model (`gpt-4o`), TTS model, conversation style, dialogue structure
- **crawl** -- Rate limits (`1.5s` delay), concurrency (`3`), timeout (`30s`), retries (`3`), robots.txt compliance
- **app** -- Database path, audio directory, API port

Environment variables are loaded from `backend/.env`:

```
OPENAI_API_KEY=your-key-here
```

## Project Structure

```
tech-blog-catchup/
├── backend/
│   ├── run.py                          # CLI entry point
│   ├── config.yaml                     # All configuration (sources, tags, podcast, crawl)
│   ├── pyproject.toml                  # Python dependencies and project metadata
│   ├── .env.example                    # Environment variable template
│   ├── data/
│   │   └── techblog.db                 # SQLite database (auto-created)
│   ├── audio/                          # Generated podcast MP3 files
│   ├── src/
│   │   ├── config.py                   # Config loader (YAML + env)
│   │   ├── database.py                 # SQLAlchemy engine and session setup
│   │   ├── models.py                   # ORM models: Post, Tag, CrawlLog
│   │   ├── api/
│   │   │   ├── app.py                  # FastAPI app factory with CORS and static files
│   │   │   ├── routes.py               # All REST endpoint handlers
│   │   │   └── schemas.py             # Pydantic request/response models
│   │   ├── crawler/
│   │   │   ├── crawl_manager.py        # Orchestrates full and incremental crawls
│   │   │   ├── sitemap_parser.py       # Parses sitemaps for full archive URLs
│   │   │   ├── feed_parser.py          # Parses RSS/Atom feeds for new posts
│   │   │   └── article_crawler.py      # Extracts article content via Crawl4AI
│   │   ├── podcast/
│   │   │   ├── manager.py              # Manages podcast generation pipeline
│   │   │   └── generator.py            # GPT-4o script generation + OpenAI TTS
│   │   └── tagger/
│   │       └── auto_tagger.py          # Keyword-based post categorization
│   └── tests/
│       └── test_config.py              # Configuration tests
├── frontend/
│   ├── package.json                    # Node dependencies (Next.js, React, Tailwind)
│   ├── next.config.ts                  # Next.js configuration
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── postcss.config.mjs              # PostCSS + Tailwind setup
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout with persistent audio bar
│   │   │   ├── page.tsx                # Home page
│   │   │   ├── explore/page.tsx        # Browse and filter posts
│   │   │   ├── playlist/page.tsx       # Playlist and queue management
│   │   │   └── globals.css             # Global styles
│   │   ├── components/
│   │   │   ├── AudioPlayer.tsx         # Persistent bottom audio player bar
│   │   │   ├── Navbar.tsx              # Top navigation bar
│   │   │   ├── PostCard.tsx            # Post summary card
│   │   │   ├── PlaylistQueue.tsx       # Queue management UI
│   │   │   ├── SourceFilter.tsx        # Source filter sidebar/dropdown
│   │   │   ├── TagFilter.tsx           # Tag filter sidebar/dropdown
│   │   │   └── TagBadge.tsx            # Tag pill/badge component
│   │   ├── hooks/
│   │   │   ├── useAudioPlayer.ts       # Audio playback state and controls
│   │   │   └── usePosts.ts             # Posts fetching and filtering logic
│   │   └── lib/
│   │       ├── api.ts                  # API client (fetch wrapper)
│   │       └── types.ts                # TypeScript type definitions
│   └── public/                         # Static assets
└── .gitignore
```

## Running Tests

```bash
cd backend
pip install -e ".[dev]"
pytest tests/ -v
```

## License

MIT
