# Tech Blog Catchup — Product Roadmap & Spec

## Current State (March 2026)

```
15 sources configured | 1,125 posts crawled | 13 podcasts generated | 5 live on Railway
```

| Metric | Value |
|-|-|
| Sources | 15 (uber, airbnb, meta, aws, discord, netflix, google, nvidia, cloudflare, slack, figma, shopify, stripe, microsoft, github) |
| Posts in DB | 1,125 total, 13 with audio, 1,100 pending, 12 failed |
| Avg podcast | ~18 min, ~$0.25/episode (LLM script + TTS) |
| Generation speed | ~2 min/podcast (sequential TTS segments) |
| Production | Railway — backend + frontend, 5 Uber podcasts live |

### Pipeline Today

```
config.yaml sources
      |
      v
  crawl_manager.py ──> extract ──> quality_score ──> auto_tag
      |                                                  |
      v                                                  v
  Post(audio_status='pending')                    post_tags
      |
      v (manual: python run.py generate)
  content_generator.py ──> gpt-5.2 ──> podcast_script (XML)
      |
      v
  podcast/generator.py ──> OpenAI TTS (nova/onyx) ──> MP3
      |
      v
  Post(audio_status='ready', audio_path='audio/uber_1.mp3')
```

### What Works Well
- AWS, Cloudflare, NVIDIA: quality 83-87, clean extraction
- Uber, Meta, Airbnb: podcasts generated successfully
- Frontend: full Spotify-like player, search, filters, playlists

### What Doesn't
- No scheduling — everything is manual CLI
- No date filtering — can't target "last 5 days"
- No user content submission — read-only
- Netflix: quality score 28 (below gate, skipped)
- Figma: 667 posts but browser-rendered, slow extraction
- TTS is sequential — ~20 API calls per podcast, no parallelism

---

## Roadmap: 4 Epics

### Epic 1: Daily Podcast Pipeline (Automated Scraping + Generation)
**Goal**: Every day, automatically crawl new posts and generate podcasts.

#### Issues to Create

**1.1 Add `--since` flag to crawl and generate commands**
- `python run.py crawl --since 5d` — only process posts published in last 5 days
- `python run.py generate --since 5d` — only generate for recent posts
- Filter: `Post.published_at >= now - timedelta(days=N)` OR `Post.crawled_at >= now - timedelta(days=N)`
- Files: `backend/run.py`, `backend/src/podcast/manager.py`

**1.2 Add scheduled crawl+generate via APScheduler**
- Run inside FastAPI lifespan (no external cron dependency)
- Default schedule: crawl all sources daily at 2 AM UTC, generate at 4 AM UTC
- Config in `config.yaml`: `scheduler.crawl_cron`, `scheduler.generate_cron`
- Rate limit: max 5 posts per source per run
- Files: `backend/src/scheduler.py` (new), `backend/src/api/app.py`, `backend/config.yaml`

**1.3 Parallelize TTS generation**
- Current: sequential (1 segment at a time, ~20 per podcast)
- Target: batch 5 segments concurrently with asyncio
- Reduces per-podcast time from ~2 min to ~30s
- Files: `backend/src/podcast/generator.py`

**1.4 Add `--batch-size` to generate for bulk processing**
- Current default: 10 posts per generate job
- Allow: `python run.py generate --batch-size 50 --since 7d`
- Progress logging: "Generated 12/50 podcasts..."
- Files: `backend/run.py`, `backend/src/podcast/manager.py`

**1.5 Fix failing sources**
- Netflix: quality score 28 — investigate extraction, try different strategy
- Uber: 12/17 failed — debug browser extraction errors
- Figma: 667 pending — optimize Crawl4AI for batch processing
- Files: `backend/config.yaml`, source-specific extraction config

---

### Epic 2: User-Submitted Content ("Podcastify My Article")
**Goal**: Any user can paste a URL or text and get a podcast version.

#### User Flow

```
User visits /submit
      |
      v
  [Paste URL] or [Paste Text]
      |
      v
  Backend extracts content (if URL) or accepts raw text
      |
      v
  LLM generates podcast script
      |
      v
  TTS generates audio
      |
      v
  User gets notification: "Your podcast is ready!"
      |
      v
  Post appears in /library under "My Submissions"
```

#### Issues to Create

**2.1 Post model: add user submission fields**
- Add columns: `submitted_by_user_id` (nullable FK → User), `is_user_submitted` (bool, default false), `submission_type` (enum: 'url', 'text', null)
- Make `source_key` nullable or allow `"user"` as a sentinel value
- Alembic migration (or manual ALTER TABLE for SQLite)
- Files: `backend/src/models.py`, migration script

**2.2 API: POST /api/posts/submit**
- Accept JSON: `{ "url": "https://..." }` or `{ "text": "...", "title": "My Article" }`
- If URL: extract via existing pipeline (trafilatura → BS4 → Crawl4AI)
- If text: store directly as `full_text`
- Run LLM script generation inline or queue as background job
- Return: `{ "post_id": 42, "job_id": 7, "status": "queued" }`
- Rate limit: 3 submissions/hour per user (or IP if no auth)
- Files: `backend/src/api/routes.py`, `backend/src/api/submit.py` (new)

**2.3 API: GET /api/posts/mine**
- Returns posts where `submitted_by_user_id = current_user.id`
- Includes submission status, audio status, generation progress
- Works without auth: uses session/cookie or returns empty

**2.4 Frontend: /submit page + SubmitForm component**
- Two tabs: "Paste URL" and "Paste Text"
- URL tab: single input field, "Podcastify" button
- Text tab: title field + textarea, "Podcastify" button
- After submit: redirect to post detail with generation progress
- Files: `frontend/src/app/submit/page.tsx`, `frontend/src/components/SubmitForm.tsx`

**2.5 Frontend: "My Submissions" in Library**
- New tab in `/library` alongside Favorites, Playlists, History
- Shows user's submitted posts with status badges
- Files: `frontend/src/app/library/page.tsx`, `frontend/src/components/LibraryTabs.tsx`

**2.6 Generation progress polling**
- Reuse existing `useGenerationStatus` hook
- Show: "Extracting content..." → "Generating script..." → "Creating audio..." → "Ready!"
- Files: `frontend/src/hooks/useGenerationStatus.ts`, `frontend/src/app/post/[id]/page.tsx`

---

### Epic 3: Expand Sources + Source Management
**Goal**: More sources, better coverage, user-suggested sources.

#### Issues to Create

**3.1 Add 10 new tech blog sources**
- Candidates: LinkedIn Engineering, Spotify Engineering, Slack Engineering (separate from current), Pinterest, Dropbox, Databricks, HashiCorp, Vercel, Supabase, Cloudflare (Workers blog)
- For each: add to `config.yaml` with `sitemap_url`, `rss_url`, test crawl
- Files: `backend/config.yaml`

**3.2 Source health dashboard**
- `GET /api/sources/health` — per-source stats: last crawl, success rate, avg quality, post count
- Frontend: `/status` page enhancement with per-source health indicators
- Files: `backend/src/api/routes.py`, `frontend/src/app/status/page.tsx`

**3.3 User-suggested sources**
- `POST /api/sources/suggest` — user submits a blog URL
- Backend validates: is it a blog? has RSS? has sitemap?
- Admin review queue (or auto-add if passes validation)
- Files: `backend/src/api/routes.py`, `backend/src/crawler/feed_discoverer.py`

---

### Epic 4: Production Hardening
**Goal**: Reliable, monitored, cost-efficient production system.

#### Issues to Create

**4.1 Cost tracking + budget limits**
- Track per-podcast cost: LLM tokens + TTS characters
- Add `cost_usd` column to Post or Job model
- Config: `max_daily_budget_usd: 10.00` — stop generation when hit
- Files: `backend/src/podcast/generator.py`, `backend/src/models.py`

**4.2 Error alerting**
- Webhook on generation failure (Slack, email, or GitHub issue)
- Failed jobs dashboard in `/status`
- Files: `backend/src/podcast/manager.py`, `backend/src/api/routes.py`

**4.3 Automated daily backup**
- Railway cron or APScheduler: `backup_db.py` daily
- Upload to S3/R2 or Railway volume snapshot
- Files: `backend/scripts/backup_db.py`, scheduler integration

**4.4 CDN for audio files**
- Currently served directly from FastAPI static mount
- Move to Cloudflare R2 or S3 with CDN for better streaming
- Update `AUDIO_BASE_URL` to point to CDN
- Files: `backend/src/podcast/generator.py`, `backend/src/api/app.py`

---

## Priority Matrix

```
                        HIGH IMPACT
                            |
    Epic 2: User Submit     |     Epic 1: Daily Pipeline
    (differentiator)        |     (core functionality)
                            |
  LOW EFFORT ---------------+--------------- HIGH EFFORT
                            |
    Epic 3: More Sources    |     Epic 4: Prod Hardening
    (incremental)           |     (operational)
                            |
                        LOW IMPACT
```

## Recommended Execution Order

### Phase 1: Get the pipeline running (Week 1)
- 1.1 `--since` flag
- 1.4 `--batch-size` flag
- 1.5 Fix failing sources (Netflix, Uber)
- Run batch generation for all 1,100 pending posts

### Phase 2: User submissions (Week 2)
- 2.1 Post model changes
- 2.2 Submit API endpoint
- 2.4 /submit page
- 2.5 Library "My Submissions" tab
- 2.6 Generation progress

### Phase 3: Automation (Week 3)
- 1.2 APScheduler for daily crawl+generate
- 1.3 Parallelize TTS
- 3.1 Add 10 new sources
- 3.2 Source health dashboard

### Phase 4: Harden (Week 4)
- 4.1 Cost tracking
- 4.2 Error alerting
- 4.3 Automated backups
- 4.4 CDN for audio

---

## Cost Estimate (Steady State)

| Metric | Daily | Monthly |
|-|-|-|
| New posts (15 sources) | ~10-20 | ~400-600 |
| Podcasts generated | ~10-20 | ~400-600 |
| LLM cost (gpt-5.2) | ~$2-5 | ~$60-150 |
| TTS cost (tts-1) | ~$2-4 | ~$60-120 |
| Total API cost | ~$5-10/day | ~$150-300/mo |
| Railway hosting | — | ~$10-20/mo |

## Testing Strategy

Each epic gets:
1. Unit tests for new backend functions
2. API integration tests via pytest
3. Frontend component tests
4. E2E smoke test via `verify_deployment.py` (extended)
5. Manual QA on Railway staging before merge
