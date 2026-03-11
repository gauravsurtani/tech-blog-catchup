# Tech Blog Catchup - Android App Specification

## 1. Product Overview

Android app (Flutter) that mirrors the Tech Blog Catchup web frontend. Users browse
tech engineering blog posts from 15 sources (Uber, Meta, Netflix, etc.), listen to
AI-generated conversational podcasts, trigger podcast generation, and manage playlists.

Backend: Existing FastAPI server at `http://10.0.2.2:8000` (emulator) -- unchanged.

## 2. Tech Stack

| Layer | Technology |
|-|-|
| Framework | Flutter 3.x (Dart 3.11+) |
| State Management | Riverpod + freezed |
| HTTP Client | Dio (retry 3x, exponential backoff, 10s timeout) |
| Audio | just_audio + audio_service (background playback) |
| Routing | go_router with ShellRoute |
| Markdown | flutter_markdown |
| Share Intent | receive_sharing_intent |
| Persistence | shared_preferences (queue, volume, playback rate) |
| Design | Material 3, dark theme, config-driven |

## 3. API Contract

Base URL: `http://10.0.2.2:8000` (Android emulator -> host machine)

### GET /api/posts
Paginated post list.
- Query params: `offset` (default 0), `limit` (default 20, max 100), `source` (comma-sep keys), `tag` (comma-sep names), `search` (string), `audio_status` (pending|ready|failed|processing), `quality_min` (0-100), `sort` (-published_at, published_at, -title, title)
- Response: `{ posts: Post[], total: int, offset: int, limit: int }`

### GET /api/posts/{id}
Full post detail.
- Response: PostDetail (Post fields + full_text, quality_score, extraction_method, crawled_at)

### GET /api/playlist
Audio-ready posts only. Same params as /api/posts.
- Response: `{ posts: Post[], total: int, offset: int, limit: int }`

### GET /api/tags
- Response: `[{ name, slug, post_count }]`

### GET /api/sources
- Response: `[{ key, name, post_count }]`

### GET /api/status
- Response: `{ total_posts, posts_by_source: [{key, name, post_count}], audio_counts: {pending, ready, failed, processing}, tag_counts: [{name, slug, post_count}] }`

### GET /api/crawl-status
- Response: `[{ source_key, source_name, enabled, feed_url, blog_url, status, post_count, total_discoverable, last_crawl_at, last_crawl_type, posts_added_last, urls_found_last, error_message }]`

### GET /api/health
- Response: `{ status, uptime_seconds, db_connected, total_posts, audio_ready_count, version }`

### GET /api/jobs
- Query params: `job_type` (crawl|generate), `status` (queued|running|completed|failed), `limit` (50)
- Response: `[{ id, job_type, status, params, result, error_message, created_at, started_at, completed_at }]`

### GET /api/jobs/{id}
- Response: Job (single item, same shape as list item)

### POST /api/crawl
- Body: `{ source?: string }` (null = crawl all)
- Rate limited: 5/min
- Response: `{ status, job_id, source }`

### POST /api/generate
- Body: `{ post_id?: int, limit?: int (default 10) }`
- Rate limited: 5/min. Returns 409 if audio already exists or duplicate job running.
- Response: `{ status, job_id, post_id, limit }`

### Audio files
Served at: `GET /audio/{filename}`
Full URL: `http://10.0.2.2:8000/audio/{post.audio_path}`

## 4. Data Models (Dart -- freezed)

### Post
```dart
id: int, url: String, sourceKey: String, sourceName: String
title: String, summary: String?, author: String?
publishedAt: DateTime?, tags: List<String>
audioStatus: String (pending|processing|ready|failed)
audioPath: String?, audioDurationSecs: int?, wordCount: int?
```

### PostDetail (extends Post fields)
```dart
fullText: String?, qualityScore: int?, extractionMethod: String?, crawledAt: DateTime?
```

### Tag
```dart
name: String, slug: String, postCount: int
```

### Source
```dart
key: String, name: String, postCount: int
```

### Job
```dart
id: int, jobType: String, status: String
params: String?, result: String?, errorMessage: String?
createdAt: DateTime, startedAt: DateTime?, completedAt: DateTime?
```

### PaginatedPosts
```dart
posts: List<Post>, total: int, offset: int, limit: int
```

### CrawlStatusItem
```dart
sourceKey: String, sourceName: String, enabled: bool
feedUrl: String, blogUrl: String?, status: String
postCount: int, totalDiscoverable: int?
lastCrawlAt: DateTime?, lastCrawlType: String?
postsAddedLast: int?, urlsFoundLast: int?, errorMessage: String?
```

### StatusInfo
```dart
totalPosts: int, postsBySource: List<Source>
audioCounts: Map<String, int>
tagCounts: List<Tag>
```

## 5. Screens & Navigation

Bottom nav: Home | Explore | Playlist | Status
GoRouter paths: `/`, `/explore`, `/playlist`, `/status`, `/post/:id`

### Home (/)
"Your Podcast Feed" -- shows only audio_status=ready posts.
- List layout with PostListItem (play button, title, source, duration)
- Load-more pagination (12 per page)
- Footer: "N posts pending generation. View in Explore" link

### Explore (/explore)
Browse all posts with filters.
- Search bar (300ms debounce)
- Sort dropdown: Newest, Oldest, Title A-Z, Title Z-A
- Filter drawer: source checkboxes (with counts), tag chips (with counts)
- Grid/list of PostCards: source badge, title, summary snippet, tags, play/generate button
- Pagination bar with page numbers

### Post Detail (/post/:id)
- Metadata header: source, author, date, word count, audio duration, tags, quality badge
- Markdown content (flutter_markdown, dark themed)
- Action button: "Generate Podcast" (pending/failed), "Generating..." (processing), "Play" (ready)

### Playlist (/playlist)
- Current queue from audio player state
- Drag-to-reorder (ReorderableListView)
- Remove individual tracks
- "Play All" and "Clear Queue" buttons

### Status (/status)
- Summary cards: total posts, audio ready, audio pending, audio failed
- Per-source crawl status table: name, status dot, post count, discoverable, last crawl
- "Crawl All Sources" button + per-source crawl triggers
- "Generate Podcasts" button

## 6. Audio Player

### Mini Player (persistent bottom bar, above bottom nav)
- Track info (title, source)
- Play/pause button
- Linear progress bar
- Next button

### Expanded Player (full screen on tap)
- Source icon placeholder
- Seek slider with current/total time
- Play/pause, previous, next
- Skip forward/back 10s
- Volume slider
- Speed control: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x, 3.0x
- Queue preview

### Behaviors
- Background playback via audio_service (Android notification controls)
- Queue: add, remove, reorder, clear
- History: tracks that have been played
- Previous: if >3s into track -> restart, else -> pop history
- Auto-advance to next in queue on track end
- Persist to SharedPreferences: queue, volume, playbackRate

## 7. Generation Flow

1. User taps "Generate Podcast" on a pending/failed post
2. App calls POST /api/generate with post_id
3. Button shows spinner, text changes to "Generating..."
4. App polls GET /api/jobs?job_type=generate&status=running every 5 seconds
5. Global GenerationBanner appears (indigo bar below app bar)
6. On job completion: refresh post, banner disappears, button becomes "Play"
7. Handle 409: show snackbar "Already generating" or "Audio already exists"

## 8. Share Intent

- Register as share target for text/plain
- When URL shared from another app: parse URL, show bottom sheet "Add to crawl?"
- On confirm: POST /api/crawl with extracted source (or generic URL)
- Validate URL against known blog domains from /api/crawl-status

## 9. Theme (Config-Driven)

ALL theme values live in `lib/theme/app_config.dart`. NO hardcoded colors in widgets.

Material 3 dark theme matching web app defaults:
- Background: `#030712` (gray-950)
- Surface: `#111827` (gray-900)
- Card border: `#1F2937` (gray-800)
- Primary: `#2563EB` (blue-600)
- On-surface text: `#F3F4F6` (gray-100)
- Muted text: `#9CA3AF` (gray-400)
- Outline: `#374151` (gray-700)
- Error: `#EF4444` (red-500)
- Success: `#22C55E` (green-500)
- Warning: `#EAB308` (yellow-500)

## 10. Error Handling

- Dio retry: 3 attempts, exponential backoff (500ms * 2^n)
- Timeout: 10s per request
- ApiError class: statusCode, message, details
- Rate limit (429): show snackbar with retry countdown
- Network error: show offline banner, retry button
- Empty states: helpful messages on all screens

## 11. Success Criteria

- App builds and runs on Android emulator
- Connects to backend at 10.0.2.2:8000
- Home shows audio-ready posts, tap plays audio in background
- Explore: search, source/tag filters, sort, pagination work
- Post detail renders markdown, generate/play buttons work
- Generate triggers job, polls status, shows banner, refreshes on complete
- Playlist: queue reorder, remove, play all
- Mini player persists across navigation
- Speed control 0.5x-3x
- Share intent from other apps works
- `flutter analyze`: zero warnings
- `flutter test`: all tests pass
