# Alternative Scraping Strategies for Tech Engineering Blogs

Research into 10 alternative approaches beyond traditional web crawling for gathering content from 15 target engineering blogs.

---

## Table of Contents

1. [Wayback Machine / CDX API](#1-wayback-machine--cdx-api)
2. [RSS/Atom Feeds](#2-rssatom-feeds)
3. [Medium API / Workarounds](#3-medium-api--workarounds)
4. [Dev.to / Hashnode Mirrors](#4-devto--hashnode-mirrors)
5. [Google Custom Search API](#5-google-custom-search-api)
6. [Common Crawl](#6-common-crawl)
7. [Archive.org APIs](#7-archiveorg-apis)
8. [Diffbot](#8-diffbot)
9. [Browser Extension Caching](#9-browser-extension-caching)
10. [LLM-Powered Extraction](#10-llm-powered-extraction)
11. [Recommendation Matrix](#11-recommendation-matrix)

---

## 1. Wayback Machine / CDX API

### How It Works

The Wayback Machine CDX Server (`web.archive.org/cdx/search/cdx`) is a free, no-auth API that returns an index of all archived snapshots for any URL. It holds 286+ billion web page captures since 2001.

### Querying for Blog Posts

**List all archived pages under a blog domain:**
```
GET http://web.archive.org/cdx/search/cdx?url=engineering.fb.com/*&output=json&fl=timestamp,original,statuscode&filter=statuscode:200&collapse=urlkey
```

Key parameters:
- `url=engineering.fb.com/*` -- wildcard for all paths under the domain
- `collapse=urlkey` -- deduplicates to unique URLs only
- `filter=statuscode:200` -- only successful captures
- `from=20230101&to=20251231` -- date range filtering (yyyyMMdd format)
- `output=json` -- JSON response instead of plain text
- `limit=1000` -- cap results per query

**Retrieve the actual archived page:**
```
https://web.archive.org/web/20250115120000*/https://engineering.fb.com/2025/01/10/some-post/
```

### Python Integration

```python
# Using waybackpy (pip install waybackpy)
from waybackpy import WaybackMachineCDXServerAPI

cdx = WaybackMachineCDXServerAPI("https://blog.cloudflare.com/*")
for snapshot in cdx.snapshots():
    print(snapshot.timestamp, snapshot.archive_url)

# Or using cdx_toolkit (pip install cdx_toolkit) -- works with both IA and Common Crawl
import cdx_toolkit
cdx = cdx_toolkit.CDXFetcher(source='ia')
for obj in cdx.iter('blog.cloudflare.com/*', filter='=status:200', limit=100):
    print(obj['timestamp'], obj['url'])
```

### Reliability Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Coverage | Good | Most major tech blogs are well-archived |
| Freshness | Fair | Captures lag days to weeks behind publication |
| Content fidelity | Fair | JS-heavy pages may archive as empty shells |
| Rate limits | Moderate | HTTP 429 common; add exponential backoff |
| Pagination | Tricky | Internal scan limits can return incomplete results |
| Availability | Variable | robots.txt changes can retroactively block access |

**Verdict**: Excellent **fallback** for historical content that is no longer available on the live site. Not suitable as a primary scraping strategy due to freshness lag and pagination quirks. Best used to fill in gaps when direct crawling fails.

---

## 2. RSS/Atom Feeds

### Feed Status for All 15 Blogs

| Blog | Feed URL | Format | Status | Notes |
|------|----------|--------|--------|-------|
| **Uber** | `https://www.uber.com/blog/engineering/rss/` | RSS | ACTIVE | Migrated from eng.uber.com; old URL may redirect |
| **Airbnb** | `https://medium.com/feed/airbnb-engineering` | RSS | ACTIVE | Medium-hosted; also accessible via airbnb.tech |
| **Meta** | `https://engineering.fb.com/feed/` | RSS | ACTIVE | Comprehensive; includes all engineering categories |
| **AWS** | `https://aws.amazon.com/blogs/architecture/feed/` | RSS | ACTIVE | Architecture-specific; AWS has many other blog feeds |
| **Discord** | `https://discord.com/blog/rss.xml` | RSS | ACTIVE | Covers all blog categories, not just engineering |
| **Netflix** | `https://netflixtechblog.com/feed` | RSS | ACTIVE | Medium-hosted publication |
| **Google** | `https://research.google/blog/rss/` | RSS | ACTIVE | Research-focused; may not cover all eng posts |
| **NVIDIA** | `https://developer.nvidia.com/blog/feed/` | RSS | ACTIVE | Developer blog; covers CUDA, AI, GPU topics |
| **Cloudflare** | `https://blog.cloudflare.com/rss/` | RSS | ACTIVE | Very reliable; high-quality feed |
| **Slack** | `https://slack.engineering/feed` | RSS | ACTIVE | Dedicated engineering subdomain |
| **Figma** | `https://www.figma.com/blog/feed/atom.xml` | Atom | ACTIVE | All blog categories; filter for `/engineering/` tag |
| **Shopify** | `https://shopify.engineering/blog.atom` | Atom | ACTIVE | Dedicated engineering subdomain |
| **Stripe** | `https://stripe.com/blog/feed.rss` | RSS | ACTIVE | All blog posts; filter for engineering content |
| **Microsoft** | `https://devblogs.microsoft.com/engineering-at-microsoft/feed` | RSS | ACTIVE | Specific to "Engineering at Microsoft" sub-blog |
| **GitHub** | `https://github.blog/feed/` | RSS | ACTIVE | All categories; filter for `/engineering/` |

### RSS Limitations for This Project

- **Only recent posts**: RSS feeds typically contain only the last 10-50 entries. They do NOT provide a full historical archive.
- **Truncated content**: Many feeds include only summaries/excerpts, not full article text. You still need to crawl the full URL.
- **No consistent schema**: Publication dates, authors, and content fields vary wildly across feeds.
- **Feed rot**: URLs can change without notice (e.g., Uber migrated from eng.uber.com).

### Community OPML Resources

Two GitHub repos maintain importable OPML files with hundreds of engineering blog feeds:
- **kilimchoi/engineering-blogs** -- OPML file with 500+ engineering blog RSS feeds
- **tuan3w/awesome-tech-rss** -- Curated list focused on tech/startup RSS feeds

### Recommendation

RSS is the **best strategy for incremental updates** (detecting new posts). For full archive crawling, it must be combined with sitemaps or another discovery mechanism. The current project architecture already uses this dual approach correctly: RSS for Mode 2 (incremental) + sitemaps/Crawl4AI for Mode 1 (full archive).

---

## 3. Medium API / Workarounds

### Affected Blogs: Netflix and Airbnb

- Netflix TechBlog: `netflixtechblog.com` (custom domain, hosted on Medium)
- Airbnb Engineering: `medium.com/airbnb-engineering` (also mirrors at `airbnb.tech`)

### Medium's Official API Status

Medium's public API was deprecated and is effectively read-only with extremely limited functionality. There is no supported way to programmatically fetch article content through their API.

### Working Workarounds

**1. Medium RSS Feeds (Best Option)**
Medium still exposes RSS feeds for all publications:
```
https://medium.com/feed/airbnb-engineering
https://medium.com/feed/netflix-techblog
```
These feeds return the last ~10 posts with full HTML content in the `<content:encoded>` field. This is the most reliable access method.

**2. Medium Archive Pages**
Medium's `/archive` pages list all historical posts by year/month:
```
https://medium.com/airbnb-engineering/archive
https://medium.com/airbnb-engineering/archive/2024
https://medium.com/airbnb-engineering/archive/2024/06
```
These pages can be crawled with a JS-rendering crawler (Crawl4AI/Playwright) to discover all post URLs. The pages use infinite scroll, so rendering JavaScript is required.

**3. Direct URL Construction**
Medium article URLs follow the pattern: `https://medium.com/<publication>/<slug>-<id>`. Once you have the URL, fetching content is straightforward since Medium articles are server-side rendered.

**4. Unofficial Medium APIs**
Some community-discovered endpoints still work:
```
# Get publication posts (undocumented, may break)
GET https://medium.com/<publication>/latest?format=json
```
Medium prepends `])}while(1);</x>` to JSON responses as an anti-CSRF measure. Strip the first characters to get valid JSON.

**5. Airbnb's Own Domain**
Airbnb also publishes engineering content at `airbnb.tech`, which may be easier to scrape than Medium directly since it is self-hosted.

### Recommendation

Use the **RSS feed for recent posts** and **archive page crawling for historical content**. The current implementation plan already handles this correctly with the `archive_url` config field and `parse_medium_archive()` function.

---

## 4. Dev.to / Hashnode Mirrors

### Investigation Results

**None of the 15 target companies maintain official Dev.to organizations or Hashnode publications for cross-posting their engineering blog content.**

These companies publish exclusively on their own domains (or Medium for Netflix/Airbnb). Dev.to and Hashnode content about these companies consists of:
- Third-party developers writing summaries or analyses of the companies' blog posts
- Individual employees cross-posting personal articles (not official company content)
- Community discussions referencing the original blog posts

### Dev.to API (If Needed Later)

Dev.to does have a public API that could be useful for discovering third-party commentary:
```
GET https://dev.to/api/articles?tag=netflix&per_page=30
GET https://dev.to/api/articles?tag=uber-engineering&per_page=30
```

### Verdict

**Not viable as a content source for this project.** The 15 target companies do not cross-post their official engineering content to Dev.to or Hashnode. Skip this approach entirely.

---

## 5. Google Custom Search API

### Major Update: Sunsetting

The **Google Custom Search JSON API is closed to new customers** as of 2025. Existing customers have until **January 1, 2027** to migrate to alternatives. Google recommends **Vertex AI Search** for searching up to 50 domains.

### How It Would Have Worked

The Custom Search JSON API allowed programmatic `site:` queries:
```
GET https://www.googleapis.com/customsearch/v1?key=KEY&cx=ENGINE_ID&q=site:engineering.fb.com
```
This returned up to 10 results per query, paginated to a maximum of 100 results. At $5 per 1,000 queries (after 100 free/day), it was a cost-effective discovery mechanism.

### Third-Party SERP API Alternatives

Since Google's own API is being sunset, these alternatives provide the same `site:` search capability:

| Provider | Pricing | Free Tier | Speed |
|----------|---------|-----------|-------|
| **Serper.dev** | $0.30/1K queries | 2,500/month free | 1-2 seconds |
| **DataForSEO** | $6/10K queries | None | Fast |
| **SerpApi** | $49/mo for 5K queries | 100/month | Standard |
| **Scrapingdog** | $0.003/query | Limited | Fast |

### Use Case for This Project

A SERP API could be used for **URL discovery**: run `site:engineering.fb.com` queries to find all indexed blog post URLs, then crawl each with Crawl4AI. This is useful when a site lacks a sitemap.

**Example with Serper.dev:**
```python
import requests

response = requests.post("https://google.serper.dev/search", json={
    "q": "site:engineering.fb.com",
    "num": 100
}, headers={"X-API-KEY": "your-key"})

urls = [r["link"] for r in response.json()["organic"]]
```

### Recommendation

**Good fallback for URL discovery** when sitemaps are missing or incomplete. Serper.dev's free tier (2,500 searches/month) is sufficient for discovering blog post URLs across all 15 blogs. However, sitemaps remain the more complete and reliable primary discovery method.

---

## 6. Common Crawl

### What It Is

Common Crawl is a nonprofit that produces free, open datasets of web crawls. The latest crawl (CC-MAIN-2026-04) contains **2.16 billion web pages** (364 TiB uncompressed). Crawls are published monthly and stored in AWS S3.

### Querying for Specific Blog Domains

**Method 1: CDX Index Server (Simple)**
```
http://index.commoncrawl.org/CC-MAIN-2026-04-index?url=engineering.fb.com/*&output=json
```
Returns a list of all captured pages from that domain in the specified crawl.

**Method 2: cdx_toolkit Python Library (Recommended)**
```python
import cdx_toolkit

cdx = cdx_toolkit.CDXFetcher(source='cc')  # 'cc' = Common Crawl

# Get all blog posts from the last 12 months
for obj in cdx.iter('engineering.fb.com/*', filter='=status:200', limit=500):
    print(obj['timestamp'], obj['url'])

# Fetch actual page content from WARC archive
    content = obj.content  # Returns the archived HTML
```

**Method 3: AWS Athena (Large-scale)**
Common Crawl publishes its index as a Parquet table queryable via AWS Athena:
```sql
SELECT url, warc_filename, warc_record_offset, warc_record_length
FROM "ccindex"."ccindex"
WHERE crawl = 'CC-MAIN-2026-04'
  AND subset = 'warc'
  AND url_host_name = 'engineering.fb.com'
```

### Coverage Assessment

Common Crawl uses **Harmonic Centrality** to prioritize domains. Major tech company blogs are well-linked and therefore well-crawled. You can check a domain's crawl priority at `webgraph.metehan.ai`.

### Costs

- **Free** to query the CDX index
- **Free** to download WARC files from S3 (no requester-pays)
- AWS Athena queries: ~$5 per TB scanned (but the index is relatively small)
- Processing/storage costs for extracted content are your own

### Limitations

- Content may be days to months old (crawls are periodic, not real-time)
- Not every page on a domain is captured in every crawl
- HTML quality varies: JS-rendered content may be incomplete
- Large-scale extraction requires downloading multi-gigabyte WARC files

### Recommendation

**Excellent for bulk historical data** and as a fallback data source. Particularly useful if you need content that has been removed from the live site. For this project, it serves best as a **supplementary source** -- use it to fill gaps where direct crawling fails, rather than as the primary pipeline.

---

## 7. Archive.org APIs

### Three Key APIs

**1. CDX Server API (Query Snapshots)**
```
GET https://web.archive.org/cdx/search/cdx?url=blog.cloudflare.com/*&output=json&fl=timestamp,original,statuscode
```
Returns a list of all archived snapshots. Free, no auth required.

**2. Availability API (Check Single URL)**
```
GET https://archive.org/wayback/available?url=blog.cloudflare.com/some-post
```
Returns the closest archived snapshot for a specific URL. Simple but limited.

**3. Save Page Now API (Request New Archive)**
```
POST https://web.archive.org/save/https://blog.cloudflare.com/new-post
```
Requests the Wayback Machine to capture a page right now. Useful for ensuring new blog posts get archived. Requires an account for bulk usage.

### Python Library: waybackpy

```python
# pip install waybackpy
import waybackpy

# Save a page
save_api = waybackpy.WaybackMachineSaveAPI("https://blog.cloudflare.com/new-post")
save_api.save()
print(save_api.archive_url)  # Returns the archived URL

# Search for all snapshots
cdx_api = waybackpy.WaybackMachineCDXServerAPI("https://blog.cloudflare.com/*")
for snapshot in cdx_api.snapshots():
    print(snapshot.archive_url, snapshot.datetime_timestamp)
```

### Systematic Archival Strategy

For this project, you could combine Archive.org APIs into a two-phase approach:

1. **Discovery**: Use CDX API to find all archived URLs for each blog domain
2. **Gap-filling**: For any blog post URLs that direct crawling missed, fetch from the Wayback Machine
3. **Proactive archiving**: Use Save Page Now to archive new posts as they appear (via RSS feed triggers)

### Rate Limits and Etiquette

- CDX API: No hard limit, but expect HTTP 429 if you query aggressively
- Save Page Now: Limited to a few requests per minute without an account
- Bulk download: An 80TB crawl dataset is available for direct download
- Be single-threaded and add delays between requests

### Recommendation

**Strong supplementary strategy.** Use it as a fallback when live crawling fails (site down, blocked, content removed). The CDX API is particularly useful for discovering the full historical archive of a blog, even if the blog's own sitemap is incomplete.

---

## 8. Diffbot

### What It Is

Diffbot is an AI-powered web data extraction API. Its **Article API** specifically extracts structured data from blog posts, news articles, and written content.

### Article API Features

When you send a URL to the Article API, it returns:
- Title, author, date published
- Full article text (clean, stripped of navigation/ads)
- Images with captions
- Tags and categories
- Sentiment analysis
- Language detection
- Comments (if present)

### Pricing (2025-2026)

| Plan | Monthly Cost | Credits/Month | Rate Limit | Key Features |
|------|-------------|---------------|------------|--------------|
| **Free** | $0 | Limited | Low | Full API access, good for testing |
| **Startup** | $299/month | 250,000 | 5 req/sec | API access |
| **Plus** | $899/month | 1,000,000 | 25 req/sec | Crawl feature included |
| **Enterprise** | Custom | Custom | Custom | Dedicated support |

1 credit = 1 extracted web page. So the Startup plan extracts up to 250,000 pages/month.

### API Usage Example

```python
import requests

response = requests.get("https://api.diffbot.com/v3/article", params={
    "token": "YOUR_TOKEN",
    "url": "https://blog.cloudflare.com/some-post"
})

article = response.json()["objects"][0]
print(article["title"])
print(article["text"])  # Clean article text
print(article["author"])
print(article["date"])
```

### Assessment for This Project

| Factor | Rating | Notes |
|--------|--------|-------|
| Extraction quality | Excellent | Best-in-class article extraction |
| Pricing | Expensive | $299/month minimum for meaningful usage |
| Speed | Fast | 1-2 seconds per extraction |
| JS rendering | Built-in | Handles dynamic pages |
| Structured output | Excellent | Clean JSON with rich metadata |

### Recommendation

**Overkill for this project.** At $299/month minimum, Diffbot is designed for commercial data extraction at scale. Crawl4AI (free, open-source) combined with LLM-powered cleaning achieves comparable results for blog post extraction at zero marginal cost. Diffbot is worth considering only if you need production-grade reliability and structured data across thousands of diverse websites.

---

## 9. Browser Extension Caching

### Strategy Overview

Use browser extensions to automatically save/archive web pages as you browse engineering blogs, building a local corpus over time.

### Key Tools

**1. SingleFile (Best for This Use Case)**
- Saves a complete web page (CSS, images, fonts, frames) as a single self-contained HTML file
- **Auto-save mode**: Automatically saves every page after it loads
- **CLI version**: `single-file-cli` can be scripted for batch operations
- **Cloud integration**: Auto-save to Google Drive, Dropbox, GitHub, WebDAV
- Available for Chrome and Firefox
- GitHub: `gildas-lormeau/SingleFile`

```bash
# SingleFile CLI usage
npx single-file https://blog.cloudflare.com/some-post --output cloudflare_post.html
```

**2. ArchiveBox (Self-Hosted Archiver)**
- Open-source self-hosted web archiving platform
- Accepts URLs from browser extension, bookmarks, Pocket, RSS feeds, and more
- Saves each page in multiple formats: HTML, SingleFile HTML, PDF, screenshot, WARC, article text
- Stores data as ordinary files and folders (no proprietary formats)
- Has a companion browser extension for one-click archiving
- GitHub: `ArchiveBox/ArchiveBox`

**Key ArchiveBox feature for this project**: ArchiveBox can ingest RSS feeds directly, automatically archiving every new post from all 15 engineering blogs.

```bash
# Feed ArchiveBox with RSS URLs
archivebox add "https://blog.cloudflare.com/rss/"
archivebox add "https://engineering.fb.com/feed/"
# It discovers and archives every post from the feed
```

**3. ArchiveWeb.page (by Webrecorder)**
- Super high-fidelity archiving extension
- Creates WARC files directly in the browser
- Captures exact page state including JS interactions

### Automated Strategy

1. Set up ArchiveBox on a server
2. Configure all 15 RSS feeds as input sources
3. Schedule periodic feed checks (e.g., every 6 hours)
4. ArchiveBox automatically archives new posts in HTML + text + PDF
5. Extract article text from the archived files for podcast generation

### Recommendation

**ArchiveBox is a strong complementary tool** to the main Crawl4AI pipeline. It provides durable local archives and can serve as a backup data source. SingleFile CLI is useful for one-off captures. However, for the primary scraping pipeline, Crawl4AI remains more suitable because it outputs clean markdown directly, which is what the podcast generation needs.

---

## 10. LLM-Powered Extraction

### The Paradigm Shift

Traditional web scraping relies on CSS selectors and XPath expressions that break when HTML structure changes. LLM-powered extraction uses semantic understanding to interpret page content contextually, making it inherently resilient to layout changes.

### How It Works for Blog Extraction

```python
import anthropic

client = anthropic.Anthropic()

# Feed raw HTML to Claude for structured extraction
def extract_article(raw_html: str) -> dict:
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": f"""Extract the article content from this HTML. Return JSON with:
            - title: string
            - author: string or null
            - published_date: ISO date string or null
            - content: the full article text in markdown format
            - tags: list of topic tags

            HTML:
            {raw_html[:50000]}"""
        }]
    )
    return json.loads(response.content[0].text)
```

### Open-Source Tools

| Tool | Type | LLM Support | Pricing |
|------|------|-------------|---------|
| **Crawl4AI** | Python library | All LLMs (local + cloud) | Free (Apache 2.0) |
| **Firecrawl** | Managed API | Cloud LLMs | $16-$333/month |
| **ScrapeGraphAI** | Python library | All LLMs | Free (MIT) |
| **llm-scraper** | Node.js library | All LLMs | Free |

### Crawl4AI (Already in Our Stack)

Crawl4AI already supports LLM-powered extraction strategies:
```python
from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import LLMExtractionStrategy

strategy = LLMExtractionStrategy(
    provider="openai/gpt-4o",
    instruction="Extract the article title, author, date, and full content as markdown"
)

async with AsyncWebCrawler() as crawler:
    result = await crawler.arun(
        url="https://blog.cloudflare.com/some-post",
        extraction_strategy=strategy
    )
    print(result.extracted_content)  # Structured JSON
```

### Firecrawl (Alternative)

Firecrawl provides a managed API that returns LLM-ready markdown:
```python
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key="your-key")

# Scrape a single page
result = app.scrape_url("https://blog.cloudflare.com/some-post", params={
    "formats": ["markdown", "extract"],
    "extract": {
        "prompt": "Extract the article title, author, date, and full content"
    }
})
```

### Cost Analysis

| Approach | Cost per Page | Notes |
|----------|--------------|-------|
| **Crawl4AI (no LLM)** | ~$0 | Markdown extraction via heuristics, no API calls |
| **Crawl4AI + local LLM** | ~$0 | Ollama with llama3, quality depends on model |
| **Crawl4AI + Claude Sonnet** | ~$0.01-0.05 | Good balance of quality and cost |
| **Crawl4AI + GPT-4o** | ~$0.03-0.10 | Highest quality extraction |
| **Firecrawl** | ~$0.001 + LLM cost | API cost + separate LLM tokens |
| **Diffbot** | ~$0.001 | Credit-based, no LLM cost |

### Recommendation for This Project

**Use Crawl4AI's built-in markdown extraction (no LLM) as the primary method**, which is free and works well for standard blog posts. Reserve **LLM-powered extraction as a fallback** for pages where heuristic extraction fails (complex layouts, heavy JavaScript). This hybrid approach costs nothing for 90%+ of pages and uses LLM credits only when needed.

If you want to add LLM extraction later, it integrates directly into the existing Crawl4AI pipeline with the `LLMExtractionStrategy` -- no architecture changes needed.

---

## 11. Recommendation Matrix

### Strategy Comparison for This Project

| Strategy | Best For | Cost | Reliability | Coverage | Effort |
|----------|----------|------|-------------|----------|--------|
| **RSS Feeds** | New post detection | Free | High | Last ~50 posts | Low |
| **Sitemaps + Crawl4AI** | Full archive | Free | High | Complete | Medium |
| **Wayback Machine CDX** | Historical fallback | Free | Medium | Partial | Medium |
| **Common Crawl** | Bulk historical data | Free | Medium | Partial | High |
| **Archive.org Save API** | Proactive archival | Free | High | On-demand | Low |
| **Medium RSS** | Netflix/Airbnb | Free | High | Last ~10 posts | Low |
| **Medium Archive Pages** | Netflix/Airbnb history | Free | Medium | Complete | Medium |
| **SERP APIs (Serper)** | URL discovery fallback | Free tier | High | Google-indexed | Low |
| **LLM Extraction** | Complex page parsing | $0.01-0.10/pg | High | On-demand | Low |
| **Diffbot** | Enterprise extraction | $299+/month | Very High | On-demand | Low |
| **ArchiveBox** | Durable local archive | Free | High | On-demand | Medium |
| **Browser Extensions** | Manual capture | Free | Manual | On-demand | High |
| **Dev.to/Hashnode** | N/A | N/A | N/A | None | N/A |
| **Google Custom Search** | Being sunset | N/A | Declining | N/A | N/A |

### Recommended Architecture (Tiered Approach)

```
Primary Pipeline (handles 90%+ of content):
  RSS Feeds (new posts) + Sitemaps + Crawl4AI (full archive)
       |
       v
  Crawl4AI markdown extraction (free, no LLM)

Fallback Layer (handles failures):
  1. Retry with JS rendering enabled
  2. LLM-powered extraction via Crawl4AI + Claude/GPT-4o
  3. Wayback Machine CDX API for removed/unavailable content

Supplementary (optional):
  - ArchiveBox for durable local archiving
  - Common Crawl for bulk historical gap-filling
  - Serper.dev for URL discovery when sitemaps are incomplete

Not Recommended:
  - Diffbot (too expensive for this use case)
  - Dev.to/Hashnode (companies do not cross-post)
  - Google Custom Search API (being sunset)
  - Browser extensions (too manual for 15 blogs)
```

### Implementation Priority

1. **Already implemented**: RSS + Sitemaps + Crawl4AI (current architecture)
2. **Easy wins to add**:
   - Wayback Machine CDX fallback in `article_crawler.py` (~50 lines of code)
   - ArchiveBox as a parallel archival pipeline (configuration only)
3. **Add if needed**:
   - LLM extraction strategy for problem pages
   - Serper.dev URL discovery for blogs with broken sitemaps
   - Common Crawl queries for deep historical content

---

## Sources

- [Wayback Machine CDX Server API - GitHub](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)
- [Wayback Machine API Guide (2025)](https://www.tinyutils.net/blog/wayback-machine-api-guide)
- [Internet Archive Developer Portal](https://archive.org/developers/index-apis.html)
- [kilimchoi/engineering-blogs - OPML](https://github.com/kilimchoi/engineering-blogs/blob/master/engineering_blogs.opml)
- [tuan3w/awesome-tech-rss](https://github.com/tuan3w/awesome-tech-rss/blob/main/feeds.opml)
- [Diffbot Pricing](https://www.diffbot.com/pricing/)
- [Diffbot Article API Introduction](https://docs.diffbot.com/reference/extract-introduction)
- [Google Custom Search JSON API](https://developers.google.com/custom-search/v1/overview)
- [Serper.dev - Google Search API](https://serper.dev/)
- [SerpApi - Google Search API](https://serpapi.com/)
- [Common Crawl - Get Started](https://commoncrawl.org/get-started)
- [cdx_toolkit - PyPI](https://pypi.org/project/cdx-toolkit/)
- [CommonCrawl with Python - JC Chouinard](https://www.jcchouinard.com/python-commoncrawl-extraction/)
- [SingleFile - GitHub](https://github.com/gildas-lormeau/SingleFile)
- [ArchiveBox](https://archivebox.io/)
- [Crawl4AI vs Firecrawl Comparison (2026)](https://brightdata.com/blog/ai/crawl4ai-vs-firecrawl)
- [Claude for Web Scraping Tutorial (2026)](https://decodo.com/blog/claude-web-scraping)
- [Web Scraping with Claude - Bright Data](https://brightdata.com/blog/web-data/web-scraping-with-claude)
- [Firecrawl - GitHub](https://github.com/firecrawl/firecrawl)
- [Crawl4AI - GitHub](https://github.com/unclecode/crawl4ai)
- [waybackpy - PyPI](https://pypi.org/project/waybackpy/)
- [Best SERP APIs in 2026 - Scrapfly](https://scrapfly.io/blog/posts/google-serp-api-and-alternatives)
