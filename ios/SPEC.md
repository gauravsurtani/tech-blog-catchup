# Tech Blog Catchup — iOS App Specification

## Overview

Native SwiftUI iOS app consuming the existing FastAPI backend. Browse tech blog posts, play AI-generated podcasts, trigger generation, manage playlists. iOS 17.0+ minimum (for `@Observable` macro).

## API Contract

Base URL: `http://localhost:8000` (configurable in `AppConfig.swift`)

| Method | Path | Query Params | Response |
|-|-|-|-|
| GET | `/api/posts` | source, tag, search, audio_status, quality_min, offset, limit, sort | `PaginatedPosts` |
| GET | `/api/posts/{id}` | — | `PostDetail` |
| GET | `/api/playlist` | source, tag, search, offset, limit, sort | `PaginatedPosts` |
| GET | `/api/tags` | — | `[TagInfo]` |
| GET | `/api/sources` | — | `[SourceInfo]` |
| GET | `/api/status` | — | `StatusInfo` |
| GET | `/api/crawl-status` | — | `[CrawlStatusItem]` |
| GET | `/api/health` | — | Health JSON |
| GET | `/api/jobs` | job_type, status, limit | `[JobInfo]` |
| GET | `/api/jobs/{id}` | — | `JobInfo` |
| POST | `/api/crawl` | — | body: `{source?}` -> `{status, job_id}` (5/min) |
| POST | `/api/generate` | — | body: `{post_id?, limit?}` -> `{status, job_id}` (5/min, 409 on dup) |
| GET | `/audio/{filename}` | — | Audio file stream |

## Data Models (match backend exactly)

### Post (summary)
- id: Int, url: String, source_key: String, source_name: String
- title: String, summary: String?, author: String?
- published_at: Date?, tags: [String]
- audio_status: String ("pending"|"processing"|"ready"|"failed")
- audio_path: String?, audio_duration_secs: Int?, word_count: Int?

### PostDetail (extends Post)
- full_text: String?, crawled_at: Date
- content_quality: String?, quality_score: Int?, extraction_method: String?

### TagInfo
- name: String, slug: String, post_count: Int

### SourceInfo
- key: String, name: String, post_count: Int

### PaginatedPosts
- posts: [Post], total: Int, offset: Int, limit: Int

### StatusInfo
- total_posts: Int, posts_by_source: [SourceInfo]
- audio_counts: [String: Int], tag_counts: [TagInfo]

### CrawlStatusItem
- source_key, source_name: String, enabled: Bool
- feed_url: String, blog_url: String?, status: String
- post_count: Int, total_discoverable: Int?
- last_crawl_at: Date?, last_crawl_type: String?
- posts_added_last: Int?, urls_found_last: Int?, error_message: String?

### JobInfo
- id: Int, job_type: String, status: String
- params: String?, result: String?, error_message: String?
- created_at: Date, started_at: Date?, completed_at: Date?

## Screens

### Home ("Your Podcast Feed")
- Shows only `audio_status=ready` posts
- Load-more pagination (12 per page)
- Each row: play button, title, source, duration, add-to-queue
- Footer: "N posts pending. View in Explore" link

### Explore (All Posts)
- LazyVGrid with search bar + sort + filter sheet
- Search: 300ms debounced, filters by title
- Filter sheet: source checkboxes + tag chips (both with counts)
- Sort: Newest, Oldest, Title A-Z, Title Z-A
- Pagination with page numbers
- Generate Podcast button on pending/failed posts

### Post Detail
- Metadata header: source, author, date, word count, duration, tags, quality badge
- Markdown content via swift-markdown-ui
- Action buttons: Play (ready), Generate Podcast (pending/failed), Generating... (processing)
- External link button to original article

### Playlist
- Audio-ready posts only
- Play All button, source/tag filter pickers
- Tap to play, add to queue

### Status Dashboard
- Summary cards: total posts, audio ready, pending, sources
- Per-source crawl list with status dots, counts, progress bars
- Crawl All Sources + Generate Podcasts trigger buttons

## Audio Player

### Mini Player (persistent bottom bar)
- Track info, play/pause, progress bar, next, speed indicator
- Tap to expand

### Expanded Player (sheet)
- Seek slider, volume control
- Speed control: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x, 3.0x
- Queue preview

### Queue
- Reorderable list, remove, clear
- Now-playing indicator
- Persisted to UserDefaults

### Background Audio
- AVAudioSession: category=.playback, mode=.spokenAudio
- Lock screen: MPNowPlayingInfoCenter (title, artist=sourceName, duration, elapsed, rate)
- Remote commands: play, pause, nextTrack, previousTrack, changePlaybackPosition
- Auto-advance on track end

## Generation Flow
1. User taps "Generate Podcast" on pending/failed post
2. POST /api/generate with post_id
3. Button shows spinner, text = "Generating..."
4. GenerationStatusService polls /api/jobs every 5s
5. GenerationBanner appears app-wide (indigo)
6. On completion: refresh post, banner disappears, button becomes "Play"
7. 409 -> show alert "Already generating" or "Audio already exists"

## Theme System
- `ThemeConfig.swift`: raw hex colors, sizes, spacing (THE single source of truth)
- `AppTheme.swift`: converts ThemeConfig to SwiftUI Color/Font/CGFloat
- `ThemeEnvironment.swift`: `@Environment(\.theme)` for view access
- Dark theme matching web app (gray-950 background, blue-600 primary)

## Dependencies
- **swift-markdown-ui** (gonzalezreal): GFM markdown rendering
- Everything else is native Apple frameworks

## Build Target
- iOS 17.0+, Swift 5.9+
- UIBackgroundModes: audio
- NSAllowsLocalNetworking: true (for simulator -> localhost)
