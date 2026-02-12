# Tech Blog Catchup - Implementation Plan

## Context

The user wants to stay current with 15 top tech company engineering blogs without reading them. The solution: scrape the **full archive** of these blogs (not just recent RSS posts), convert posts into **NotebookLM-style conversational podcasts** (two AI hosts discussing the content), and provide a **hostable web app** with tagging and playlists to listen while commuting.

**Key decisions**:
- **Scraping**: Crawl4AI (open-source, free) for full historical archives via sitemaps + RSS for ongoing new posts
- **Podcast engine**: Podcastfy (open-source, `pip install podcastfy`) with **OpenAI GPT-4o** for conversational script + **OpenAI TTS** for multi-speaker audio
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js with TypeScript + Tailwind CSS
- **Database**: SQLite with SQLAlchemy
- **Quality first** — willing to pay API costs for NotebookLM-level output

---

## Architecture

```
┌──────────────────────────────────────┐
│     Next.js Frontend (TypeScript)    │
│  Browse, filter, tag, playlist,      │
│  Spotify-like audio player           │
│  Port 3000                           │
└──────────────┬───────────────────────┘
               │ REST API
┌──────────────┴───────────────────────┐
│     FastAPI Backend (Python)         │
│  /api/posts, /api/tags, /api/sources │
│  /api/crawl, /api/generate           │
│  /audio/* (static MP3 serving)       │
│  Port 8000                           │
└──────┬──────────┬────────────────────┘
       │          │
┌──────┴───┐  ┌───┴──────────────┐
│ Crawler  │  │  Podcast Gen     │
│ Crawl4AI │  │  Podcastfy +     │
│ + RSS    │  │  OpenAI GPT-4o   │
└──────────┘  └──────────────────┘
       │          │
┌──────┴──────────┴────────────────────┐
│  SQLite + audio/ directory           │
└──────────────────────────────────────┘
```

---

## Scraping Strategy (Two Modes)

### Mode 1: Full Archive Crawl (initial load)
Uses **Crawl4AI** (open-source Python crawler with Playwright) to get ALL historical posts:

1. **Discover URLs via sitemaps**: Fetch `sitemap.xml` from each blog — lists every post URL ever published. Handle sitemap indexes (sitemaps of sitemaps).
2. **For Medium-hosted blogs** (Netflix, Airbnb): Crawl the `/archive` page which lists all posts by year/month
3. **Crawl each URL**: Crawl4AI renders JavaScript, extracts article text as clean Markdown
4. **Deduplicate**: Store URL as unique key, skip already-crawled posts on re-runs
5. **Rate limiting**: Add polite delays between requests (1-2s), respect robots.txt

**Why Crawl4AI over individual scrapers**:
- One crawler handles all 15 blogs uniformly (no per-blog scraper maintenance)
- Handles JavaScript-rendered pages (Playwright under the hood)
- Outputs clean Markdown/text — ready for TTS
- Free, open-source, Python-native (`pip install crawl4ai`)

### Mode 2: Incremental Updates (ongoing)
Uses **RSS/Atom feeds** (via feedparser) for new posts only:
- Check feeds periodically for new entries
- Extract full text via Crawl4AI for each new post URL
- Much faster than full crawl — only processes new content

---

## Blog Sources (15)

| Key | Name | Feed URL | Sitemap URL |
|-----|------|----------|-------------|
| uber | Uber Engineering | `https://eng.uber.com/feed/` | `https://www.uber.com/sitemap.xml` |
| airbnb | Airbnb Tech Blog | `https://medium.com/feed/airbnb-engineering` | Medium `/archive` page |
| meta | Meta Engineering | `https://engineering.fb.com/feed/` | `https://engineering.fb.com/sitemap.xml` |
| aws | AWS Architecture | `https://aws.amazon.com/blogs/architecture/feed` | `https://aws.amazon.com/blogs/architecture/sitemap.xml` |
| discord | Discord Engineering | `https://discord.com/blog/rss.xml` | `https://discord.com/sitemap.xml` |
| netflix | Netflix TechBlog | `https://netflixtechblog.com/feed` | Medium `/archive` page |
| google | Google Research | `https://research.google/blog/rss/` | `https://research.google/sitemap.xml` |
| nvidia | NVIDIA Developer | `https://developer.nvidia.com/blog/feed` | `https://developer.nvidia.com/sitemap.xml` |
| cloudflare | Cloudflare Blog | `https://blog.cloudflare.com/rss/` | `https://blog.cloudflare.com/sitemap.xml` |
| slack | Slack Engineering | `https://slack.engineering/feed` | `https://slack.engineering/sitemap.xml` |
| figma | Figma Tech Blog | `https://www.figma.com/blog/feed/atom.xml` | `https://www.figma.com/sitemap.xml` |
| shopify | Shopify Engineering | `https://shopify.engineering/blog.atom` | `https://shopify.engineering/sitemap.xml` |
| stripe | Stripe Engineering | `https://stripe.com/blog/feed.rss` | `https://stripe.com/sitemap.xml` |
| microsoft | Microsoft DevBlogs | `https://devblogs.microsoft.com/engineering-at-microsoft/feed` | `https://devblogs.microsoft.com/sitemap.xml` |
| github | GitHub Engineering | `https://githubengineering.com/atom.xml` | `https://github.blog/sitemap.xml` |

---

## Project Structure

```
tech-blog-catchup/
├── backend/
│   ├── pyproject.toml
│   ├── config.yaml                   # Blog sources, tags, crawl settings
│   ├── .env.example                  # Template for OPENAI_API_KEY
│   ├── run.py                        # CLI entry point
│   ├── audio/                        # Generated podcast MP3s (gitignored)
│   ├── data/                         # SQLite DB (gitignored)
│   ├── src/
│   │   ├── __init__.py
│   │   ├── config.py                 # Load config.yaml → typed dataclasses
│   │   ├── database.py               # SQLAlchemy engine, session, init_db
│   │   ├── models.py                 # Post, Tag, CrawlLog ORM models
│   │   ├── crawler/
│   │   │   ├── __init__.py
│   │   │   ├── sitemap_parser.py     # Parse sitemap.xml → list of post URLs
│   │   │   ├── article_crawler.py    # Crawl4AI: URL → clean text/markdown
│   │   │   ├── feed_parser.py        # RSS/Atom parsing for incremental updates
│   │   │   └── crawl_manager.py      # Orchestrates full crawl + incremental
│   │   ├── podcast/
│   │   │   ├── __init__.py
│   │   │   ├── generator.py          # Podcastfy wrapper: text → podcast MP3
│   │   │   └── manager.py            # Batch orchestration for pending posts
│   │   ├── tagger/
│   │   │   ├── __init__.py
│   │   │   └── auto_tagger.py        # Keyword-based auto-tagging
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── app.py                # FastAPI app + CORS + static files
│   │       ├── routes.py             # All REST endpoints
│   │       └── schemas.py            # Pydantic models
│   └── tests/
│       ├── __init__.py
│       ├── test_sitemap_parser.py
│       ├── test_article_crawler.py
│       ├── test_auto_tagger.py
│       └── test_generator.py
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout with persistent audio player
│   │   │   ├── page.tsx              # Home: latest episodes feed
│   │   │   ├── explore/
│   │   │   │   └── page.tsx          # Browse by source/tag with filters
│   │   │   └── playlist/
│   │   │       └── page.tsx          # Playlist builder & player
│   │   ├── components/
│   │   │   ├── AudioPlayer.tsx       # Persistent bottom bar (Spotify-like)
│   │   │   ├── PostCard.tsx          # Blog post card with play button
│   │   │   ├── TagBadge.tsx          # Tag pill
│   │   │   ├── SourceFilter.tsx      # Source multiselect
│   │   │   ├── TagFilter.tsx         # Tag multiselect
│   │   │   ├── PlaylistQueue.tsx     # Playlist queue sidebar
│   │   │   └── Navbar.tsx            # Top navigation
│   │   ├── lib/
│   │   │   ├── api.ts               # Fetch wrapper for FastAPI
│   │   │   └── types.ts             # TypeScript interfaces
│   │   └── hooks/
│   │       ├── useAudioPlayer.ts     # Playback state + queue management
│   │       └── usePosts.ts           # Posts fetching + filtering
│   └── public/
│
├── .gitignore
└── README.md
```

---

## Database Schema

**`posts`** table:

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, autoincrement | |
| url | TEXT | UNIQUE, NOT NULL | Canonical post URL (dedup key) |
| source_key | TEXT | NOT NULL | e.g. "uber" |
| source_name | TEXT | NOT NULL | e.g. "Uber Engineering" |
| title | TEXT | NOT NULL | |
| summary | TEXT | | RSS excerpt or first 500 chars |
| full_text | TEXT | | Extracted article body (Markdown) |
| author | TEXT | | |
| published_at | DATETIME | | Original pub date |
| crawled_at | DATETIME | NOT NULL | When we crawled it |
| audio_status | TEXT | DEFAULT 'pending' | pending/processing/ready/failed |
| audio_path | TEXT | | Relative path to MP3 in audio/ |
| audio_duration_secs | INTEGER | | Duration in seconds |
| word_count | INTEGER | | Word count of full_text |

**`tags`** table:

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK |
| name | TEXT | UNIQUE, NOT NULL |
| slug | TEXT | UNIQUE, NOT NULL |

**`post_tags`** junction:

| Column | Type | Constraints |
|--------|------|-------------|
| post_id | INTEGER | FK → posts.id, PK |
| tag_id | INTEGER | FK → tags.id, PK |

**`crawl_log`** table:

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK |
| source_key | TEXT | Which blog |
| crawl_type | TEXT | "full" or "incremental" |
| started_at | DATETIME | |
| completed_at | DATETIME | |
| urls_found | INTEGER | Total URLs discovered |
| posts_added | INTEGER | New posts stored |

---

## Full config.yaml Specification

```yaml
sources:
  uber:
    name: "Uber Engineering"
    feed_url: "https://eng.uber.com/feed/"
    sitemap_url: "https://www.uber.com/sitemap.xml"
    blog_url_pattern: "/blog/"
    enabled: true
  airbnb:
    name: "Airbnb Tech Blog"
    feed_url: "https://medium.com/feed/airbnb-engineering"
    archive_url: "https://medium.com/airbnb-engineering/archive"
    blog_url_pattern: "/airbnb-engineering/"
    platform: "medium"
    enabled: true
  meta:
    name: "Meta Engineering"
    feed_url: "https://engineering.fb.com/feed/"
    sitemap_url: "https://engineering.fb.com/sitemap.xml"
    enabled: true
  aws:
    name: "AWS Architecture"
    feed_url: "https://aws.amazon.com/blogs/architecture/feed"
    sitemap_url: "https://aws.amazon.com/blogs/architecture/sitemap.xml"
    enabled: true
  discord:
    name: "Discord Engineering"
    feed_url: "https://discord.com/blog/rss.xml"
    sitemap_url: "https://discord.com/sitemap.xml"
    blog_url_pattern: "/blog/"
    enabled: true
  netflix:
    name: "Netflix TechBlog"
    feed_url: "https://netflixtechblog.com/feed"
    archive_url: "https://netflixtechblog.medium.com/archive"
    blog_url_pattern: "netflixtechblog"
    platform: "medium"
    enabled: true
  google:
    name: "Google Research"
    feed_url: "https://research.google/blog/rss/"
    sitemap_url: "https://research.google/sitemap.xml"
    blog_url_pattern: "/blog/"
    enabled: true
  nvidia:
    name: "NVIDIA Developer"
    feed_url: "https://developer.nvidia.com/blog/feed"
    sitemap_url: "https://developer.nvidia.com/sitemap.xml"
    blog_url_pattern: "/blog/"
    enabled: true
  cloudflare:
    name: "Cloudflare Blog"
    feed_url: "https://blog.cloudflare.com/rss/"
    sitemap_url: "https://blog.cloudflare.com/sitemap.xml"
    enabled: true
  slack:
    name: "Slack Engineering"
    feed_url: "https://slack.engineering/feed"
    sitemap_url: "https://slack.engineering/sitemap.xml"
    enabled: true
  figma:
    name: "Figma Tech Blog"
    feed_url: "https://www.figma.com/blog/feed/atom.xml"
    sitemap_url: "https://www.figma.com/sitemap.xml"
    blog_url_pattern: "/blog/"
    enabled: true
  shopify:
    name: "Shopify Engineering"
    feed_url: "https://shopify.engineering/blog.atom"
    sitemap_url: "https://shopify.engineering/sitemap.xml"
    enabled: true
  stripe:
    name: "Stripe Engineering"
    feed_url: "https://stripe.com/blog/feed.rss"
    sitemap_url: "https://stripe.com/sitemap.xml"
    blog_url_pattern: "/blog/"
    enabled: true
  microsoft:
    name: "Microsoft DevBlogs"
    feed_url: "https://devblogs.microsoft.com/engineering-at-microsoft/feed"
    sitemap_url: "https://devblogs.microsoft.com/sitemap.xml"
    blog_url_pattern: "/engineering-at-microsoft/"
    enabled: true
  github:
    name: "GitHub Engineering"
    feed_url: "https://githubengineering.com/atom.xml"
    sitemap_url: "https://github.blog/sitemap.xml"
    blog_url_pattern: "/engineering/"
    enabled: true

# Tag definitions with keywords for auto-tagging
tags:
  Generative AI:
    keywords: ["generative ai", "genai", "gen ai", "text generation", "image generation",
               "diffusion", "dall-e", "midjourney", "stable diffusion", "gpt", "chatgpt", "copilot"]
  LLMs:
    keywords: ["llm", "large language model", "language model", "transformer",
               "attention mechanism", "bert", "gpt", "llama", "mistral", "claude",
               "gemini", "token", "tokenizer", "prompt engineering", "rag",
               "retrieval augmented"]
  Fine Tuning:
    keywords: ["fine-tuning", "fine tuning", "finetuning", "lora", "qlora", "peft",
               "rlhf", "instruction tuning", "alignment", "dpo"]
  Infrastructure:
    keywords: ["infrastructure", "kubernetes", "k8s", "docker", "container", "terraform",
               "cloud", "aws", "gcp", "azure", "microservice", "service mesh",
               "load balancer", "cdn", "scaling"]
  Data Engineering:
    keywords: ["data engineering", "data pipeline", "etl", "data lake", "data warehouse",
               "spark", "kafka", "airflow", "dbt", "batch processing", "stream processing",
               "data quality"]
  Frontend:
    keywords: ["frontend", "front-end", "react", "vue", "angular", "css", "javascript",
               "typescript", "web component", "browser", "dom", "ui", "ux",
               "design system", "accessibility"]
  Mobile:
    keywords: ["mobile", "ios", "android", "swift", "kotlin", "react native", "flutter",
               "app development"]
  Security:
    keywords: ["security", "vulnerability", "authentication", "authorization", "encryption",
               "oauth", "zero trust", "penetration testing", "threat", "malware", "firewall"]
  ML/AI:
    keywords: ["machine learning", "deep learning", "neural network", "training", "inference",
               "model", "prediction", "classification", "regression", "computer vision", "nlp",
               "natural language processing", "reinforcement learning"]
  DevOps:
    keywords: ["devops", "ci/cd", "continuous integration", "continuous delivery", "deployment",
               "monitoring", "observability", "sre", "site reliability", "incident", "on-call",
               "alerting", "grafana", "prometheus"]
  Databases:
    keywords: ["database", "sql", "nosql", "postgresql", "mysql", "mongodb", "redis",
               "cassandra", "dynamodb", "query optimization", "indexing", "sharding",
               "replication"]
  Distributed Systems:
    keywords: ["distributed system", "consensus", "raft", "paxos", "eventual consistency",
               "cap theorem", "replication", "partitioning", "fault tolerance", "availability",
               "latency", "throughput", "rpc", "grpc"]

# Podcast generation settings
podcast:
  llm_model: "gpt-4o"
  tts_model: "openai"
  conversation_style: ["engaging", "educational", "technical but accessible"]
  roles_person1: "Main host - explains concepts clearly"
  roles_person2: "Co-host - asks insightful questions, adds context"
  dialogue_structure: ["Introduction", "Main Discussion", "Key Takeaways", "Wrap-up"]
  output_language: "English"
  engagement_techniques: ["analogies", "real-world examples", "humor where appropriate"]

# Crawl settings
crawl:
  delay_between_requests: 1.5    # seconds
  max_concurrent_crawls: 3
  request_timeout: 30            # seconds
  max_retries: 3
  respect_robots_txt: true

# Application settings
app:
  db_path: "data/techblog.db"
  audio_dir: "audio"
  fastapi_port: 8000
```

---

## Module Interfaces (Key Functions)

### `src/config.py`
```python
@dataclass
class BlogSource:
    key: str
    name: str
    feed_url: str
    sitemap_url: str | None = None
    archive_url: str | None = None     # For Medium blogs
    blog_url_pattern: str | None = None # URL pattern to filter blog posts from sitemap
    platform: str | None = None         # "medium" for Medium-hosted blogs
    enabled: bool = True

@dataclass
class TagDefinition:
    name: str
    slug: str       # auto-generated from name
    keywords: list[str]

@dataclass
class Config:
    sources: list[BlogSource]
    tags: list[TagDefinition]
    podcast: dict
    crawl: dict
    app: dict

def load_config(path: str = "config.yaml") -> Config: ...
def get_config() -> Config: ...  # singleton
```

### `src/crawler/sitemap_parser.py`
```python
def parse_sitemap(sitemap_url: str, url_pattern: str | None = None) -> list[str]:
    """Fetch sitemap.xml, handle sitemap indexes, return list of blog post URLs.
    If url_pattern provided, filter URLs to only those containing the pattern."""

def parse_medium_archive(archive_url: str) -> list[str]:
    """Crawl Medium /archive page to get all historical post URLs."""
```

### `src/crawler/article_crawler.py`
```python
async def crawl_article(url: str) -> dict | None:
    """Use Crawl4AI to fetch URL and extract clean content.
    Returns dict with: title, text (markdown), author, published_at, word_count.
    Returns None on failure."""

async def crawl_articles_batch(urls: list[str], delay: float = 1.5) -> list[dict]:
    """Crawl multiple URLs with rate limiting. Returns list of results."""
```

### `src/crawler/feed_parser.py`
```python
@dataclass
class FeedEntry:
    url: str
    title: str
    summary: str | None
    author: str | None
    published_at: datetime | None

def parse_feed(feed_url: str) -> list[FeedEntry]:
    """Parse RSS/Atom feed, return entries."""
```

### `src/crawler/crawl_manager.py`
```python
def crawl_full(session: Session, source: BlogSource, config: Config) -> int:
    """Full archive crawl: sitemap → URLs → crawl each → store + tag. Returns new post count."""

def crawl_incremental(session: Session, source: BlogSource, config: Config) -> int:
    """RSS-only: feed → new entries → crawl full text → store + tag. Returns new post count."""

def crawl_all(session: Session, config: Config, mode: str = "full") -> dict[str, int]:
    """Crawl all enabled sources. Returns {source_key: new_post_count}."""
```

### `src/tagger/auto_tagger.py`
```python
def auto_tag_post(post: Post, tag_definitions: list[TagDefinition], session: Session) -> list[str]:
    """Scan title + full_text for keyword matches. Assign tags. Return tag names."""

def ensure_tags_exist(tag_definitions: list[TagDefinition], session: Session) -> None:
    """Create Tag records for all defined tags (idempotent)."""
```

### `src/podcast/generator.py`
```python
def generate_podcast_for_post(post: Post, config: Config) -> tuple[str, int] | None:
    """Use Podcastfy to generate conversational podcast from post content.
    Returns (audio_path, duration_secs) or None on failure.

    Podcastfy integration:
    - from podcastfy.client import generate_podcast
    - Pass post URL or text content
    - Configure via conversation_config dict matching config.yaml podcast settings
    - Output MP3 to audio/{source_key}_{post_id}.mp3
    """
```

### `src/podcast/manager.py`
```python
def generate_pending(session: Session, config: Config, limit: int = 10) -> int:
    """Find posts with audio_status='pending' + full_text, generate podcasts.
    Updates audio_status, audio_path, audio_duration_secs. Returns count."""

def generate_for_post(session: Session, post_id: int, config: Config) -> bool:
    """Generate podcast for specific post. Returns True on success."""
```

---

## FastAPI Endpoints

| Method | Path | Description | Query Params |
|--------|------|-------------|-------------|
| GET | `/api/posts` | List posts | `source`, `tag`, `search`, `audio_status`, `offset`, `limit`, `sort` |
| GET | `/api/posts/{id}` | Single post detail | |
| GET | `/api/tags` | All tags with post counts | |
| GET | `/api/sources` | All sources with post counts | |
| GET | `/api/playlist` | Posts with audio ready | same filters as /api/posts |
| POST | `/api/crawl` | Trigger crawl | body: `{source?, mode?}` |
| POST | `/api/generate` | Trigger podcast gen | body: `{post_id?, limit?}` |
| GET | `/api/status` | System stats | |
| Static | `/audio/{filename}` | Serve MP3 files | |

---

## Frontend TypeScript Interfaces

```typescript
interface Post {
  id: number;
  url: string;
  source_key: string;
  source_name: string;
  title: string;
  summary: string | null;
  author: string | null;
  published_at: string | null;
  tags: string[];
  audio_status: "pending" | "processing" | "ready" | "failed";
  audio_path: string | null;
  audio_duration_secs: number | null;
  word_count: number | null;
}

interface Tag {
  name: string;
  slug: string;
  post_count: number;
}

interface Source {
  key: string;
  name: string;
  post_count: number;
}

interface PlaylistTrack {
  post: Post;
  position: number;
}
```

---

## Frontend Pages & Components

**Home (`/`)** — Latest podcast episodes, sorted by date, play button on each card

**Explore (`/explore`)** — Full browse with sidebar filters: source checkboxes, tag pills, date range, search. Grid of PostCards.

**Playlist (`/playlist`)** — Build custom queue from filtered posts, drag-to-reorder, sequential playback, save playlists to localStorage.

**AudioPlayer (persistent bottom bar)** — Play/pause, prev/next, progress bar, volume, current track info, queue indicator. Always visible across all pages. Uses HTML5 `<audio>` element with custom controls.

**PostCard** — Source name, title, date, tag badges, summary, word count, duration, play button.

---

## Implementation Phases

### Phase 1: Backend — Crawling + DB + API

**Create**: All `backend/` files listed in project structure.

**Python deps**: `fastapi`, `uvicorn`, `crawl4ai`, `feedparser`, `beautifulsoup4`, `lxml`, `requests`, `sqlalchemy`, `pyyaml`, `python-dotenv`, `rich`, `python-dateutil`

**System deps**: `playwright` (installed by `crawl4ai`)

**CLI commands**:
- `python run.py init` — create DB + directories
- `python run.py crawl` — full archive crawl of all sources
- `python run.py crawl --source uber` — crawl single source
- `python run.py crawl --mode incremental` — RSS-only new posts
- `python run.py status` — show counts per source, tag distribution
- `python run.py api` — start FastAPI server

**Verify**:
- `python run.py init` → creates `data/techblog.db` with correct tables
- `python run.py crawl --source cloudflare` → discovers all posts via sitemap, crawls and stores
- `python run.py crawl --source cloudflare` again → skips already-crawled URLs (0 new)
- `python run.py crawl --mode incremental` → RSS-only, fetches new posts
- `python run.py status` → per-source counts and tag distribution
- `python run.py api` → FastAPI on :8000, Swagger at /docs works

### Phase 2: Podcast Generation via Podcastfy + OpenAI

**Create**: `backend/src/podcast/generator.py`, `backend/src/podcast/manager.py`

**Additional deps**: `podcastfy`, `openai`

**System deps**: `ffmpeg`

**Config**: `OPENAI_API_KEY` in `backend/.env`

**Podcastfy integration**:
```python
from podcastfy.client import generate_podcast

# generate_podcast() accepts:
# - urls: list of URLs to convert
# - text: raw text content
# - conversation_config: dict with LLM/TTS/style settings
# Returns path to generated audio file
```

**CLI**: `python run.py generate --limit 5`, `python run.py generate --post-id 42`

**Verify**:
- `python run.py generate --limit 1` → creates one podcast MP3 in audio/
- Listen to it — natural 2-host conversation about the blog post
- `POST localhost:8000/api/generate` → triggers generation via API
- `GET localhost:8000/audio/{file}.mp3` → streams the audio

### Phase 3: Next.js Frontend

**Create**: All `frontend/` files listed in project structure.

**NPM deps**: `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `@headlessui/react`, `lucide-react`

**Key implementation details**:
- AudioPlayer uses React Context for global state across pages
- `useAudioPlayer` hook manages: currentTrack, queue, isPlaying, progress, volume
- API client (`lib/api.ts`) talks to FastAPI backend at configurable base URL
- Posts fetching uses SWR or React Query for caching + revalidation

**Verify**:
- `cd frontend && npm run dev` → app on :3000
- Home page shows latest posts with play buttons
- Explore: filter by source + tag + search
- Clicking play → persistent bottom audio player starts
- Playlist: build queue, prev/next, sequential playback
- Audio player persists across page navigation

### Phase 4: Polish + Tests

- pytest tests for sitemap_parser, article_crawler, auto_tagger, API routes
- Error handling: individual source failures don't crash the crawl
- Rate limiting / polite crawling (respect robots.txt)
- Logging throughout with `rich` for CLI output
- `pytest tests/ -v` passes

---

## Dependencies Summary

**Backend (Python, in pyproject.toml)**:
```
fastapi>=0.110
uvicorn>=0.29
crawl4ai>=0.4
feedparser>=6.0
beautifulsoup4>=4.12
lxml>=5.0
requests>=2.31
sqlalchemy>=2.0
pyyaml>=6.0
python-dotenv>=1.0
python-dateutil>=2.9
rich>=13.0
podcastfy>=0.2
openai>=1.0
```

Dev: `pytest>=8.0`, `httpx>=0.27`

System: `ffmpeg`, `playwright` (auto-installed by crawl4ai)

**Frontend (Node/TypeScript, in package.json)**:
```
next, react, react-dom, typescript, tailwindcss,
@headlessui/react, lucide-react
```

---

## Research Notes (for reference during implementation)

### Podcastfy Usage
- GitHub: github.com/souzatharsis/podcastfy
- Install: `pip install podcastfy`
- Python 3.11+ required
- Supports 100+ LLMs, multiple TTS providers
- Key function: `generate_podcast(urls=[], text="", conversation_config={})`
- conversation_config controls: LLM model, voice style, dialogue structure, engagement techniques
- Requires OPENAI_API_KEY env var for GPT-4o + OpenAI TTS

### Crawl4AI Usage
- GitHub: github.com/unclecode/crawl4ai
- Install: `pip install crawl4ai` (auto-installs Playwright)
- `crawl4ai-setup` command installs browser
- Key class: `AsyncWebCrawler`
- Returns markdown text, handles JavaScript rendering
- BM25-based content filtering for relevant text extraction

### Sitemap Parsing
- Most sitemaps follow XML sitemap protocol
- May have sitemap index files pointing to sub-sitemaps
- Filter URLs with blog_url_pattern to exclude non-blog pages
- Python: parse with `requests` + `xml.etree.ElementTree`

### Medium Archive Crawling
- Netflix: https://netflixtechblog.medium.com/archive
- Airbnb: https://medium.com/airbnb-engineering/archive
- Archive pages show all posts organized by year/month
- Can be scraped with Crawl4AI or BeautifulSoup

---

## Agentic Task Breakdown (Parallelizable)

These tasks are designed to be executed by independent Claude Code agents. Tasks within the same group can run in parallel. Groups must run sequentially.

### Group 0: Project Scaffold (must run first, 1 agent)

**Task 0.1: Create project scaffold and config files**
- Create all directories: `backend/src/`, `backend/src/crawler/`, `backend/src/podcast/`, `backend/src/tagger/`, `backend/src/api/`, `backend/tests/`, `backend/audio/`, `backend/data/`, `frontend/src/`, `frontend/src/app/`, etc.
- Create all `__init__.py` files
- Create `backend/pyproject.toml` with all Python dependencies listed in Dependencies Summary section
- Create `backend/config.yaml` — full content is in the "Full config.yaml Specification" section above
- Create `backend/.env.example` with `OPENAI_API_KEY=your-key-here`
- Create `.gitignore` — ignore `backend/audio/`, `backend/data/`, `__pycache__`, `*.pyc`, `.venv`, `node_modules`, `.env`, `.next`
- Create `backend/src/config.py` — implementation matches the Module Interfaces section
- Create `backend/src/database.py` — SQLAlchemy engine, sessionmaker, Base, init_db()
- Create `backend/src/models.py` — ORM models matching Database Schema section exactly
- **Acceptance**: `python -c "from src.config import load_config; c = load_config(); print(len(c.sources))"` prints 15. `python -c "from src.database import init_db; init_db()"` creates the DB.

### Group 1: Backend Core (3 parallel agents)

**Task 1.1: Crawler modules** (Agent A)
- Create `backend/src/crawler/sitemap_parser.py` — parse_sitemap(), parse_medium_archive()
- Create `backend/src/crawler/article_crawler.py` — crawl_article(), crawl_articles_batch() using Crawl4AI AsyncWebCrawler
- Create `backend/src/crawler/feed_parser.py` — parse_feed() using feedparser
- Create `backend/src/crawler/crawl_manager.py` — crawl_full(), crawl_incremental(), crawl_all()
- **Depends on**: Task 0.1 (config, database, models)
- **Acceptance**: `python run.py crawl --source cloudflare` fetches posts and stores them. Run again → 0 new posts (dedup works).

**Task 1.2: Auto-tagger** (Agent B)
- Create `backend/src/tagger/auto_tagger.py` — auto_tag_post(), ensure_tags_exist(), get_matching_tags()
- Uses keyword definitions from config.yaml
- Case-insensitive matching on title + summary + full_text
- **Depends on**: Task 0.1 (config, database, models)
- **Acceptance**: A post with "kubernetes" in the title gets tagged "Infrastructure". A post about "GPT" gets tagged "LLMs" and "Generative AI".

**Task 1.3: FastAPI app + routes** (Agent C)
- Create `backend/src/api/schemas.py` — Pydantic models for all endpoints
- Create `backend/src/api/routes.py` — all endpoints from FastAPI Endpoints table
- Create `backend/src/api/app.py` — FastAPI app with CORS middleware, static file mount for audio/
- **Depends on**: Task 0.1 (config, database, models)
- **Acceptance**: `python -m uvicorn src.api.app:app` starts server. `curl localhost:8000/api/tags` returns JSON. `/docs` shows Swagger.

### Group 2: CLI + Integration (1 agent, after Group 1)

**Task 2.1: CLI entry point (run.py) + integration**
- Create `backend/run.py` with argparse subcommands: init, crawl, status, generate, api, serve
- Wire up all modules: crawl → store → auto_tag → status display
- Use `rich` for pretty CLI output (tables, progress bars)
- **Depends on**: Tasks 1.1, 1.2, 1.3
- **Acceptance**: `python run.py init` creates DB. `python run.py crawl --source cloudflare` works end-to-end. `python run.py status` shows table. `python run.py api` starts server.

### Group 3: Podcast Generation (1 agent, can run after Group 1)

**Task 3.1: Podcastfy integration**
- Create `backend/src/podcast/generator.py` — wraps Podcastfy's generate_podcast()
- Create `backend/src/podcast/manager.py` — batch processing of pending posts
- Configure Podcastfy with conversation_config from config.yaml podcast section
- Handle errors gracefully (set audio_status='failed' on error)
- Save MP3s to `backend/audio/{source_key}_{post_id}.mp3`
- **Depends on**: Task 0.1 (config, database, models)
- **Acceptance**: `python run.py generate --limit 1` creates an MP3. The MP3 contains a 2-host conversation about a blog post.

### Group 4: Frontend (3 parallel agents, can start after Group 1)

**Task 4.1: Next.js scaffold + layout + API client** (Agent D)
- Create `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.js`, `frontend/tailwind.config.ts`
- Create `frontend/src/lib/types.ts` — TypeScript interfaces from the Frontend TypeScript Interfaces section
- Create `frontend/src/lib/api.ts` — fetch wrapper with base URL config, typed API calls for all endpoints
- Create `frontend/src/app/layout.tsx` — root layout with Navbar + AudioPlayer slot
- Create `frontend/src/components/Navbar.tsx` — top nav with Home, Explore, Playlist links
- Run `npm install` to verify everything builds
- **Depends on**: None (just needs the API contract defined in the plan)
- **Acceptance**: `npm run dev` starts without errors. Layout renders with navbar.

**Task 4.2: Home + Explore pages with filters** (Agent E)
- Create `frontend/src/components/PostCard.tsx` — card with play button, tags, source, date
- Create `frontend/src/components/TagBadge.tsx` — colored pill for tag names
- Create `frontend/src/components/SourceFilter.tsx` — multiselect checkboxes for sources
- Create `frontend/src/components/TagFilter.tsx` — pill toggles for tags
- Create `frontend/src/hooks/usePosts.ts` — data fetching with filtering, pagination
- Create `frontend/src/app/page.tsx` — home page: latest episodes
- Create `frontend/src/app/explore/page.tsx` — browse page with sidebar filters + grid
- **Depends on**: Task 4.1 (types, api client, layout)
- **Acceptance**: Home page shows post cards. Explore page filters by source and tag. Search works.

**Task 4.3: Audio player + Playlist** (Agent F)
- Create `frontend/src/hooks/useAudioPlayer.ts` — React Context + hook for global audio state (queue, currentTrack, isPlaying, progress, volume)
- Create `frontend/src/components/AudioPlayer.tsx` — persistent bottom bar with play/pause, prev/next, progress, volume, track info
- Create `frontend/src/components/PlaylistQueue.tsx` — queue sidebar with drag-to-reorder
- Create `frontend/src/app/playlist/page.tsx` — playlist builder + player page
- **Depends on**: Task 4.1 (types, api client, layout)
- **Acceptance**: Clicking play on any PostCard starts audio in the bottom player. Player persists across pages. Playlist page allows building and playing a queue.

### Group 5: Testing + Polish (2 parallel agents, after all above)

**Task 5.1: Backend tests** (Agent G)
- Create `backend/tests/test_sitemap_parser.py` — test URL parsing, sitemap index handling
- Create `backend/tests/test_article_crawler.py` — test content extraction
- Create `backend/tests/test_auto_tagger.py` — test keyword matching for each tag category
- Create `backend/tests/test_generator.py` — test podcast generation (mock Podcastfy)
- Add error handling throughout: individual feed failures, network timeouts, malformed content
- **Acceptance**: `pytest tests/ -v` all pass

**Task 5.2: README** (Agent H)
- Create `README.md` with: project description, architecture diagram, setup instructions (Python + Node), usage guide (CLI commands), frontend screenshots placeholder, contributing guide
- **Acceptance**: A new developer can follow README to set up and run the project

---

## Execution Order Summary

```
Group 0 (scaffold)                  ✅ DONE
    ↓
Group 1 (crawler, tagger, API)      ✅ DONE
    ↓
Group 2 (CLI) / Group 3 (podcast)   ✅ DONE
    ↓
Group 4 (frontend)                  ✅ DONE
    ↓
Group 5 (tests + README)            ✅ DONE
    ↓
Group 6 (verification + deploy)     ← NEXT
```

---

## Group 6: Fix Broken Functionality + Make Deployable

### Context
Audit found the app is ~70% done. Key issues:

| Category | Status | Issues |
|----------|--------|--------|
| Play buttons (Home/Explore) | **BROKEN** | `handlePlay` is `console.log` — never calls audio player |
| Podcast generation | **BROKEN** | `podcastfy` not installed, not in pyproject.toml |
| `/api/crawl` & `/api/generate` | **FRAGILE** | Block entire server synchronously for minutes |
| Multi-select filtering | **BROKEN** | Frontend sends `"uber,meta"` CSV, backend expects single value |
| PostCard "Add to queue" | **BROKEN** | Button has no onClick handler |
| Deployment config | **MISSING** | No Dockerfile, no docker-compose, CORS hardcoded to localhost |
| Database, tests, frontend build | **WORKS** | 53 tests pass, `npm run build` succeeds |

---

### Step 1: Wire play buttons to audio player context (CRITICAL)

**Files to modify:**
- `frontend/src/app/page.tsx` (Home)
- `frontend/src/app/explore/page.tsx` (Explore)
- `frontend/src/components/PostCard.tsx`

**Home page** (`page.tsx:51-54`): Replace `console.log` with actual play:
```typescript
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
// ...
const { play, addToQueue } = useAudioPlayer();
function handlePlay(post: Post) { play(post); }
```

**Explore page** (`explore/page.tsx:126-128`): Same fix.

**PostCard** (`PostCard.tsx:134-137`): Wire "Add to queue" button — add `onAddToQueue` prop:
```typescript
interface PostCardProps {
  post: Post;
  onPlay?: (post: Post) => void;
  onAddToQueue?: (post: Post) => void;
}
// ...
<button onClick={() => onAddToQueue?.(post)}>
```

Then pass `addToQueue` from Home/Explore pages.

---

### Step 2: Make crawl/generate non-blocking (CRITICAL)

**File**: `backend/src/api/routes.py` (lines 159-201)

Use FastAPI's `BackgroundTasks` so the endpoints return immediately:
```python
from fastapi import BackgroundTasks

@router.post("/crawl")
def trigger_crawl(req: CrawlRequest, bg: BackgroundTasks):
    bg.add_task(_do_crawl, req.source, req.mode)
    return {"status": "started", "source": req.source, "mode": req.mode}
```

Same pattern for `/generate`. Add a `/api/jobs` or extend `/api/status` to check progress.

---

### Step 3: Fix multi-select filtering (MEDIUM)

**File**: `backend/src/api/routes.py` (lines 48-51)

Backend should handle comma-separated source/tag values:
```python
if source:
    source_keys = [s.strip() for s in source.split(",")]
    if len(source_keys) == 1:
        query = query.filter(Post.source_key == source_keys[0])
    else:
        query = query.filter(Post.source_key.in_(source_keys))
if tag:
    tag_names = [t.strip() for t in tag.split(",")]
    if len(tag_names) == 1:
        query = query.join(Post.tags).filter(Tag.name == tag_names[0])
    else:
        query = query.join(Post.tags).filter(Tag.name.in_(tag_names))
```

---

### Step 4: Handle podcastfy gracefully

**File**: `backend/pyproject.toml` — Add `podcastfy` back (with comment about install issues)
**File**: `backend/src/podcast/generator.py` — Already has `try/except ImportError`, which is fine

The generator already fails gracefully. The key fix is documentation — README should note:
```
pip install podcastfy  # May require: pip install --no-deps podcastfy
```

---

### Step 5: Configurable CORS for production

**File**: `backend/src/api/app.py` (line 20-26)

```python
import os

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(CORSMiddleware, allow_origins=origins, ...)
```

---

### Step 6: Dockerfiles + docker-compose

**Create `backend/Dockerfile`**:
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir . && crawl4ai-setup
COPY . .
RUN mkdir -p data audio
EXPOSE 8000
CMD ["python", "run.py", "api"]
```

**Create `frontend/Dockerfile`** (multi-stage):
- Stage 1: `node:20-alpine`, `npm ci && npm run build`
- Stage 2: Copy standalone output, expose 3000

**Modify `frontend/next.config.ts`**: Add `output: "standalone"`

**Create `docker-compose.yml`** at project root:
```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes: [./backend/data:/app/data, ./backend/audio:/app/audio]
    env_file: ./backend/.env
    environment: { CORS_ORIGINS: "http://localhost:3000" }
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment: { NEXT_PUBLIC_API_URL: "http://localhost:8000" }
    depends_on: [backend]
```

---

### Step 7: Health check endpoint

**File**: `backend/src/api/routes.py` — Add:
```python
@router.get("/health")
def health():
    return {"status": "ok"}
```

---

### Step 8: Update README with deployment guide

Add sections:
- **Quick verify**: `cd backend && python run.py init && python -m pytest tests/ -v`
- **Docker local**: `docker-compose up --build`, visit `localhost:3000`
- **Production deploy** (Vercel + Railway):
  - Frontend → Vercel, set `NEXT_PUBLIC_API_URL` to Railway backend URL
  - Backend → Railway, set `OPENAI_API_KEY` + `CORS_ORIGINS`
- **Self-hosted**: Docker on any VPS

---

### Files to create/modify summary

| Action | File | What |
|--------|------|------|
| Modify | `frontend/src/app/page.tsx` | Wire play to useAudioPlayer |
| Modify | `frontend/src/app/explore/page.tsx` | Wire play to useAudioPlayer |
| Modify | `frontend/src/components/PostCard.tsx` | Add onAddToQueue prop |
| Modify | `backend/src/api/routes.py` | BackgroundTasks + CSV filter support + health check |
| Modify | `backend/src/api/app.py` | Configurable CORS via env var |
| Modify | `frontend/next.config.ts` | Standalone output mode |
| Modify | `backend/.env.example` | Add CORS_ORIGINS |
| Create | `backend/Dockerfile` | Python backend container |
| Create | `frontend/Dockerfile` | Next.js frontend container |
| Create | `docker-compose.yml` | Orchestration |
| Modify | `README.md` | Deployment guide |

### Verification
1. `cd backend && python run.py init` — DB creates
2. `cd backend && python -m pytest tests/ -v` — 53+ tests pass (may add new tests for CSV filter)
3. `cd frontend && npx tsc --noEmit` — zero errors
4. `cd frontend && npm run build` — production build succeeds
5. Start backend (`python run.py api`) + frontend (`npm run dev`) — pages load, play buttons trigger audio player
6. `docker-compose up --build` — both containers start
7. POST `/api/crawl` returns immediately (non-blocking)
