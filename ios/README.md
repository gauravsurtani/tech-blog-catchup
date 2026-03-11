# Tech Blog Catchup — iOS App

Native SwiftUI iOS app for Tech Blog Catchup. Browse tech engineering blog posts, play AI-generated podcasts, trigger generation, manage playlists. Consumes the same FastAPI backend as the web and Android apps.

## Requirements

- iOS 17.0+ (uses `@Observable` macro)
- Swift 5.9+
- Xcode 16+
- [xcodegen](https://github.com/yonaskolb/XcodeGen) (for project generation)
- Backend running at `http://localhost:8000` (configurable in `AppConfig.swift`)

## Setup

```bash
cd ios

# Generate the Xcode project
brew install xcodegen   # if not installed
xcodegen generate

# Open in Xcode
open TechBlogCatchup.xcodeproj

# Build for iOS 17.0 Simulator, then run
```

The app expects the FastAPI backend at `localhost:8000`. The iOS Simulator can reach `localhost` directly (unlike Android which needs `10.0.2.2`).

## Architecture

```
ThemeConfig.swift (hex colors, sizes)
       |
   AppTheme.swift (@Observable, SwiftUI types)
       |
   @Environment(\.theme)  <-- every view reads from here
       |
   Views --> ViewModels (@Observable, @MainActor) --> APIClient.shared
                                                        |
                                                   FastAPI backend
```

### Config-Driven Design

Two files control the entire app:

| File | Controls | Example |
|-|-|-|
| `Config/AppConfig.swift` | All behavior: URLs, timeouts, retry counts, page sizes, poll intervals, playback speeds | Change `baseURL` to point at production |
| `Config/ThemeConfig.swift` | All visuals: every color (hex), font size, spacing, radius, animation speed | Change `primary = "#2563EB"` to restyle the whole app |

No other file contains raw color literals or hardcoded sizing values.

### Key Patterns

- **@Observable + @MainActor** on all ViewModels (iOS 17+, not ObservableObject)
- **@Environment(\.theme)** for all styling — no raw `Color` literals in views
- **Codable + CodingKeys** on all models mapping snake_case JSON to camelCase Swift
- **Singleton services**: `APIClient.shared`, `AudioPlayerService.shared`, `GenerationStatusService.shared`
- **Immutable models**: All model properties are `let`, ViewModels use `private(set)`

## Features Built

### Home ("Your Podcast Feed")
- Shows only `audio_status=ready` posts
- Infinite scroll with load-more pagination (12 per page)
- Each row: green play button, title, source, duration badge, add-to-queue
- Tap row navigates to post detail
- Footer: "{N} posts pending. View in Explore" with tab switch

### Explore (All Posts)
- Search bar with 300ms debounce
- Source + tag multi-select filter sheet (sends comma-separated to API)
- Sort picker: Newest, Oldest, Title A-Z, Title Z-A
- Page numbers with prev/next navigation
- Post cards with: source badge, title, summary, tags, audio action button
- Generate Podcast button on pending/failed posts
- 409 conflict handling with error alert

### Post Detail
- Full metadata header: source badge, author, date (relative), word count, duration, quality grade (A-F)
- Markdown content rendering via `swift-markdown-ui` with dark theme
- Generate Podcast / Play Podcast button (adapts per audio status)
- External link to original article
- Pull-to-refresh

### Audio Player
- **Mini player**: persistent bottom bar with progress line, play/pause, next, speed badge. Tap to expand.
- **Expanded player**: full sheet with seek slider, volume, transport controls (prev/skip back/play/skip forward/next), speed picker, queue preview
- **Queue management**: reorderable list, swipe to delete, clear all, now-playing indicator
- **Speed control**: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x, 3.0x
- **Background audio**: AVAudioSession (.playback, .spokenAudio)
- **Lock screen controls**: MPNowPlayingInfoCenter (title, artist, duration, elapsed, rate) + MPRemoteCommandCenter (play, pause, next, previous, seek, skip forward/backward)
- **Queue persistence**: saved to UserDefaults, survives app restart
- **Auto-advance**: plays next in queue when track ends
- **Previous logic**: if >3s into track, restarts; otherwise pops from history

### Playlist
- Audio-ready posts only (from `/api/playlist`)
- Search bar with 300ms debounce
- Play All button
- Source and tag filter menus
- Per-row: play button, title, source, duration, add-to-queue
- Tap row navigates to post detail

### Status Dashboard
- Summary cards grid: total posts, audio ready, pending, source count
- Crawl All Sources + Generate Podcasts action buttons with loading states
- Per-source crawl rows: status dot (green/red/yellow/gray), post count, progress bar (scraped vs discoverable), last crawl time, error message
- Pull-to-refresh

### Generation System
- `GenerateButton`: adapts per audio status (Play/Generate/Generating...)
- `GenerationStatusService`: polls `/api/jobs?job_type=generate&status=running` every 5s
- Auto-stops polling after 60s of no active jobs (battery-friendly)
- `GenerationBannerView`: app-wide indigo banner with animation when generating
- 409 conflict handling on duplicate generation attempts

### Shared Components
- `ThemedButton` (primary/secondary/ghost styles)
- `ThemedCard` (surface bg + border + radius)
- `ThemedBadge` (colored pill)
- `ThemedDivider`
- `TagBadgeView` (with selected state)
- `SkeletonView` (animated shimmer loading placeholder)
- `EmptyStateView` (icon + title + message + optional action)
- `ErrorBannerView` (red banner with retry)
- `ProgressBarView` (horizontal fill bar)
- `OfflineBannerView` (red wifi.slash banner when no connectivity)

### Haptic Feedback
- `HapticService` utility with play/pause (medium), queue (light), generate (success notification), error (error notification)
- Applied to: play/pause buttons, add-to-queue, generate podcast triggers across all screens

### Offline Detection
- `NetworkMonitor` singleton using NWPathMonitor
- `OfflineBannerView` shown at top of app when connectivity lost
- Animated transitions (slide + opacity)

### Share Extension
- Separate app extension target (`com.techblog.catchup.share`)
- Accepts URLs and plain text from other apps
- Saves shared URLs to App Group UserDefaults (`group.com.techblog.catchup`)
- Confirmation alert with source hostname

## File Inventory

57 Swift files total.

| Directory | Files | Purpose |
|-|-|-|
| `Config/` | 2 | AppConfig (behavior), ThemeConfig (visuals) |
| `Theme/` | 3 | AppTheme, ThemeEnvironment, ThemedComponents |
| `Models/` | 7 | Post, PostDetail, TagInfo, SourceInfo, JobInfo, PaginatedPosts, CrawlStatusItem, StatusInfo |
| `Services/` | 5 | APIClient, APIError, AudioPlayerService, HapticService, NetworkMonitor |
| `Extensions/` | 2 | Color+Hex, Date+Formatting |
| `Components/` | 6 | TagBadge, Skeleton, EmptyState, ErrorBanner, ProgressBar, OfflineBanner |
| `Features/Home/` | 4 | HomeView, HomeViewModel, PostListItemView, PendingFooterView |
| `Features/Explore/` | 7 | ExploreView, ExploreViewModel, PostCardView, FilterSheetView, SearchBarView, SortPickerView, PaginationView |
| `Features/PostDetail/` | 4 | PostDetailView, PostDetailViewModel, PostMetadataHeader, MarkdownContentView |
| `Features/Generate/` | 3 | GenerateButton, GenerationStatusService, GenerationBannerView |
| `Features/Player/` | 5 | PlayerViewModel, MiniPlayerView, ExpandedPlayerView, QueueSheetView, PlaybackSpeedPicker |
| `Features/Playlist/` | 2 | PlaylistView, PlaylistViewModel |
| `Features/Status/` | 4 | StatusView, StatusViewModel, CrawlStatusRow, SummaryCardView |
| Root | 2 | TechBlogCatchupApp, ContentView |
| `ShareExtension/` | 1 | ShareViewController (URL sharing from other apps) |

## Dependencies

Only **1 external package**:

| Package | URL | Purpose |
|-|-|-|
| swift-markdown-ui | github.com/gonzalezreal/swift-markdown-ui | GFM markdown rendering in PostDetailView |

Everything else is native Apple frameworks: Foundation, SwiftUI, AVFoundation, MediaPlayer, Observation, Network, UIKit, UniformTypeIdentifiers.

## API Contract

The app consumes the FastAPI backend unchanged. All endpoints are defined in `Services/APIClient.swift`.

| Method | Path | iOS Usage |
|-|-|-|
| GET | `/api/posts` | Home (audio_status=ready), Explore (all filters) |
| GET | `/api/posts/{id}` | Post detail |
| GET | `/api/playlist` | Playlist tab |
| GET | `/api/tags` | Filter sheet, playlist filters |
| GET | `/api/sources` | Filter sheet, playlist filters |
| GET | `/api/status` | Status dashboard |
| GET | `/api/crawl-status` | Per-source crawl rows |
| GET | `/api/jobs` | Generation polling |
| POST | `/api/crawl` | Status "Crawl All" button |
| POST | `/api/generate` | Generate Podcast buttons (409 handled) |
| GET | `/audio/{filename}` | Audio stream for AVPlayer |

## Known Limitations

1. **No Xcode on dev machine**: Project was built without full Xcode installed (only Command Line Tools). All 57 files pass `swiftc -parse` syntax checking and core modules pass `swiftc -typecheck` cross-file validation. First `xcodebuild` with iOS SDK may surface SwiftUI-specific type mismatches.
2. **MarkdownUI theme uses ThemeConfig directly**: The MarkdownUI library's Theme builder requires raw values, not SwiftUI environment variables. `MarkdownContentView.swift` references `ThemeConfig` hex strings directly instead of `@Environment(\.theme)`.
3. **Current track not persisted**: Queue is saved to UserDefaults, but the currently-playing track and playback position are not restored on app restart.
4. **No app icon**: Asset catalog placeholder exists but no actual icon image.
5. **Share Extension pending URLs**: URLs saved via Share Extension are stored in App Group UserDefaults but the main app doesn't yet read/process them (needs a check on launch to import shared URLs).

## Code Quality Audit Results

The codebase was independently audited (code-reviewer agent). Summary:

- **0 RED flags remaining** (5 found and fixed)
- **~6 YELLOW flags remaining** (non-blocking quality concerns)
- **38+ files rated GREEN** (complete, well-structured, follows patterns)
- All ViewModels use `@MainActor` + `private(set)`
- No dead code (duplicate `ThemedCardView.swift` was removed)
- No hardcoded color defaults (replaced with theme fallbacks)

### Fixes Applied Post-Audit

| Issue | Fix |
|-|-|
| Double NavigationLink (PostListItemView + HomeView) | Removed from PostListItemView |
| `formattedDuration` conflict in QueueSheetView | Removed duplicate private extension |
| PostDetailView alert not clearing `generateError` | Added `clearGenerateError()` method |
| Multi-filter only sending first value | Now joins with commas for API |
| GenerationStatusService polling forever | Auto-stops after 60s idle |
| Missing `@MainActor` on ViewModels | Added to all 5 ViewModels |
| Dead `ThemedCardView.swift` duplicate | Deleted |
| Hardcoded `.blue` defaults | Changed to `nil` with theme fallback |
| Double snake_case encoding | Removed `.convertToSnakeCase` from encoder |
