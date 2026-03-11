# Data Models Codemap

> Freshness: 2026-02-15 | Auto-generated from source analysis

## Database Schema (SQLite)

```
┌──────────────────────────────────────────────────────────┐
│ posts                                                     │
├───────────────────┬──────────┬───────────────────────────┤
│ id                │ INTEGER  │ PK, autoincrement          │
│ url               │ TEXT     │ UNIQUE, NOT NULL           │
│ source_key        │ TEXT     │ indexed                    │
│ source_name       │ TEXT     │                            │
│ title             │ TEXT     │ NOT NULL                   │
│ summary           │ TEXT     │ nullable                   │
│ full_text         │ TEXT     │ nullable                   │
│ author            │ TEXT     │ nullable                   │
│ published_at      │ DATETIME │ nullable                   │
│ crawled_at        │ DATETIME │ default: utcnow            │
│ audio_status      │ TEXT     │ "pending"|"processing"|    │
│                   │          │ "ready"|"failed", indexed  │
│ audio_path        │ TEXT     │ nullable                   │
│ audio_duration_secs│ INTEGER │ nullable                   │
│ word_count        │ INTEGER  │ nullable                   │
│ content_quality   │ TEXT     │ "good"|"low"|"rejected"    │
│ quality_score     │ INTEGER  │ 0-100, nullable            │
│ extraction_method │ TEXT     │ strategy name, nullable    │
│ content_hash      │ TEXT     │ nullable                   │
│ podcast_script    │ TEXT     │ XML-tagged, nullable       │
└───────────────────┴──────────┴───────────────────────────┘
         │ M:N
         ├──────────────────┐
┌────────┴─────────┐  ┌────┴───────────┐
│ post_tags (join)  │  │ tags            │
├──────────────────┤  ├────────────────┤
│ post_id │ FK→posts│  │ id   │ INTEGER │
│ tag_id  │ FK→tags │  │ name │ UNIQUE  │
└──────────────────┘  │ slug │ UNIQUE  │
                       └────────────────┘

┌──────────────────────────────────────────────────────────┐
│ crawl_log                                                 │
├───────────────────┬──────────┬───────────────────────────┤
│ id                │ INTEGER  │ PK                         │
│ source_key        │ TEXT     │                            │
│ crawl_type        │ TEXT     │ "smart"                    │
│ status            │ TEXT     │ "running"|"success"|"error"│
│ started_at        │ DATETIME │                            │
│ completed_at      │ DATETIME │ nullable                   │
│ urls_found        │ INTEGER  │ nullable                   │
│ posts_added       │ INTEGER  │ nullable                   │
│ error_message     │ TEXT     │ nullable                   │
└───────────────────┴──────────┴───────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ jobs                                                      │
├───────────────────┬──────────┬───────────────────────────┤
│ id                │ INTEGER  │ PK                         │
│ job_type          │ TEXT     │ "crawl"|"generate"         │
│ status            │ TEXT     │ "queued"|"running"|        │
│                   │          │ "completed"|"failed"       │
│ params            │ TEXT     │ JSON string, nullable      │
│ result            │ TEXT     │ JSON string, nullable      │
│ error_message     │ TEXT     │ nullable                   │
│ created_at        │ DATETIME │ default: utcnow            │
│ started_at        │ DATETIME │ nullable                   │
│ completed_at      │ DATETIME │ nullable                   │
└───────────────────┴──────────┴───────────────────────────┘
```

## Config Dataclasses

```python
BlogSource(key, name, feed_url, sitemap_url?, archive_url?,
           blog_page_url?, blog_url_pattern?, platform?,
           enabled=True, needs_browser=False, article_selector?,
           strip_selectors?, pagination_pattern?)

TagDefinition(name, slug, keywords[])

Config(sources[], tags[], podcast{}, crawl{}, app{}, llm{})
```

## Extraction Types (frozen dataclasses)

```python
QualityResult(score: 0-100, grade: A-F, word_count, heading_count,
              code_block_count, list_count, link_density, has_raw_html, flags[])

ExtractionResult(url, title, markdown, summary, word_count,
                 quality: QualityResult, extraction_method,
                 author?, published_at?, podcast_script?)
```

## API Response Schemas (Pydantic)

| Schema           | Purpose                | Key Fields                        |
|------------------|------------------------|-----------------------------------|
| PostSummary      | List item              | id, title, tags[], audio_status   |
| PostDetail       | Full detail            | + full_text, quality_score        |
| PaginatedPosts   | Paginated list         | posts[], total, offset, limit     |
| TagInfo          | Tag with count         | name, slug, post_count            |
| SourceInfo       | Source with count      | key, name, post_count             |
| CrawlStatusItem  | Per-source status      | status, post_count, total_discoverable |
| StatusInfo       | Dashboard summary      | total_posts, audio_counts         |
| JobInfo          | Background job         | job_type, status, result          |
| CrawlRequest     | Trigger crawl          | source?                           |
| GenerateRequest  | Trigger generation     | post_id?, limit=10                |

## State Lifecycles

```
Post.audio_status:  pending -> processing -> ready | failed
Job.status:         queued  -> running    -> completed | failed
CrawlLog.status:    running -> success | error
CircuitBreaker:     CLOSED  -> OPEN -> HALF_OPEN -> CLOSED
```

## Quality Grading

| Grade | Score Range | Action                    |
|-------|-------------|---------------------------|
| A     | 80-100      | Accept, podcast eligible  |
| B     | 60-79       | Accept, podcast eligible  |
| C     | 40-59       | Accept, no podcast        |
| D     | 20-39       | Accept, low quality       |
| F     | 0-19        | Rejected                  |
