# Frontend Codemap

> Freshness: 2026-02-15 | Auto-generated from source analysis

## Module Tree (16 files)

```
frontend/src/
├── app/
│   ├── layout.tsx          # Root layout: Navbar + AudioPlayerProvider + AudioPlayer
│   ├── page.tsx            # Home: latest episodes grid with load more
│   ├── globals.css         # Tailwind imports + dark theme defaults
│   ├── explore/
│   │   └── page.tsx        # Browse: search + source/tag filters + sort + pagination
│   ├── playlist/
│   │   └── page.tsx        # Playlist: audio-ready posts with queue management
│   ├── post/
│   │   └── [id]/page.tsx   # Post detail: full text + play + queue
│   └── status/
│       └── page.tsx        # Crawl status dashboard + progress bars
│
├── components/
│   ├── AudioPlayer.tsx     # Fixed bottom bar: play/pause, seek, speed, volume
│   ├── Navbar.tsx          # Top nav: Home, Explore, Playlist, Status links
│   ├── PostCard.tsx        # Card: title, source, tags, play/queue buttons
│   ├── PlaylistQueue.tsx   # Slide-out panel: queue management, reorder, clear
│   ├── SourceFilter.tsx    # Checkbox list with select all/clear
│   ├── TagFilter.tsx       # Tag pill toggles with counts
│   ├── TagBadge.tsx        # Colored tag pill (deterministic hash colors)
│   └── MarkdownRenderer.tsx# react-markdown + remark-gfm with prose styling
│
├── hooks/
│   └── useAudioPlayer.tsx  # AudioPlayerProvider context: queue, play, seek, volume
│
└── lib/
    ├── api.ts              # Fetch wrapper: retry (3x), timeout (10s), ApiError
    └── types.ts            # TypeScript interfaces: Post, Tag, Source, CrawlStatusItem
```

## Route Map

| Route            | Page Component       | Data Source          | Key Features               |
|------------------|----------------------|----------------------|----------------------------|
| `/`              | `page.tsx`           | GET /api/posts       | Grid, load more, play      |
| `/explore`       | `explore/page.tsx`   | GET /api/posts + tags + sources | Filters, sort, pagination |
| `/playlist`      | `playlist/page.tsx`  | GET /api/playlist    | Queue management           |
| `/post/[id]`     | `post/[id]/page.tsx` | GET /api/posts/{id}  | Full text, markdown render |
| `/status`        | `status/page.tsx`    | GET /api/crawl-status| Progress bars, crawl/gen   |

## Component Dependency Graph

```
layout.tsx
├── Navbar.tsx
├── AudioPlayerProvider (from useAudioPlayer.tsx)
└── AudioPlayer.tsx
    └── useAudioPlayer()

page.tsx (Home)
├── PostCard.tsx
│   └── TagBadge.tsx
└── useAudioPlayer()

explore/page.tsx
├── PostCard.tsx
├── SourceFilter.tsx
├── TagFilter.tsx
└── useAudioPlayer()

playlist/page.tsx
├── PostCard.tsx
├── PlaylistQueue.tsx
│   └── useAudioPlayer()
└── useAudioPlayer()

post/[id]/page.tsx
├── TagBadge.tsx
├── MarkdownRenderer.tsx
└── useAudioPlayer()

status/page.tsx
├── ProgressIndicator (local)
└── api.ts (getCrawlStatus, triggerCrawl, triggerGenerate)
```

## Type Interfaces (lib/types.ts)

| Interface       | Key Fields                                         |
|-----------------|-----------------------------------------------------|
| Post            | id, url, source_key, title, tags[], audio_status    |
| PostDetail      | extends Post + full_text, crawled_at                |
| Tag             | name, slug, post_count                              |
| Source          | key, name, post_count                               |
| CrawlStatusItem | source_key, status, post_count, total_discoverable |
| PaginatedPosts  | posts[], total, offset, limit                       |
| StatusInfo      | total_posts, posts_by_source, audio_counts          |

## API Client (lib/api.ts)

| Function           | Endpoint               | Returns            |
|--------------------|------------------------|--------------------|
| getPosts()         | GET /api/posts         | PaginatedPosts     |
| getPost()          | GET /api/posts/{id}    | PostDetail         |
| getTags()          | GET /api/tags          | Tag[]              |
| getSources()       | GET /api/sources       | Source[]           |
| getPlaylist()      | GET /api/playlist      | PaginatedPosts     |
| getCrawlStatus()   | GET /api/crawl-status  | CrawlStatusItem[]  |
| triggerCrawl()     | POST /api/crawl        | { job_id }         |
| triggerGenerate()  | POST /api/generate     | { job_id }         |

## Global State

| Provider            | Hook                | Scope   | Key State                    |
|---------------------|---------------------|---------|------------------------------|
| AudioPlayerProvider | useAudioPlayer()    | App-wide| currentTrack, queue, isPlaying, volume, playbackRate |
