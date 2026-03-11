# Tech Blog Catchup - Android App

Flutter Android app that mirrors the web frontend. Browse tech blog posts from 15 engineering blogs, listen to AI-generated podcasts, trigger generation, and manage playlists.

## Quick Start

```bash
# Install dependencies
flutter pub get
dart run build_runner build --delete-conflicting-outputs

# Start backend (from project root)
cd ../backend && python3 run.py api --reload

# Run app (from android/)
flutter run
```

The app connects to `http://10.0.2.2:8000` (Android emulator default).
Override: `flutter run --dart-define=BASE_URL=http://192.168.1.x:8000`

## Features

### Home - Your Podcast Feed
- Shows only audio-ready posts sorted by newest
- Tap play button to start playback immediately
- Long-press to add to queue
- Pull-to-refresh + load-more pagination (12 per page)
- Footer links to Explore for pending posts

### Explore - Browse All Posts
- Search bar with 300ms debounce
- Multi-select source and tag filters (drawer)
- Sort: newest, oldest, title A-Z/Z-A
- PostCard grid with source badge, summary, tag chips
- Generate Podcast button on pending/failed posts
- Pagination with page numbers

### Post Detail
- Full markdown rendering (dark themed)
- Metadata header: source, author, date, word count, quality grade (A/B/C/D)
- Tag chips
- Action button: Play (ready), Generate (pending/failed), Generating... (processing)

### Audio Player
- Background playback with notification controls
- Mini player: persistent bottom bar with progress + play/pause + next
- Expanded player (tap mini player): seek slider, volume, speed control
- Speed options: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x, 3.0x
- Queue management: add, remove, reorder, clear
- History tracking with smart previous (restart if >3s in, else go back)
- Auto-advance to next track
- Persists queue, volume, and playback rate across app restarts

### Playlist
- Visual queue with drag-to-reorder
- Play All and Clear Queue actions
- Remove individual tracks
- Empty state with helpful guidance

### Status Dashboard
- Summary cards: total posts, audio ready/pending/processing/failed
- Per-source crawl status table with colored indicators
- Crawl All Sources and Generate Podcasts buttons
- Per-source crawl triggers

### Podcast Generation
- Trigger via POST /api/generate (single post or batch)
- Real-time polling every 5 seconds
- Global indigo banner while generating
- Auto-refresh when job completes
- 409 conflict handling (already generating / audio exists)

### Share Intent
- Receive URLs from other apps
- "Add to crawl?" confirmation dialog
- Sends URL to backend crawl endpoint

## Architecture

```
lib/
  main.dart                    # Entry point (ProviderScope)
  app/                         # Shell, router, navigation, share intent
  core/                        # Providers, env config, shared utils
  models/                      # 7 freezed data classes (Post, Tag, Job, etc.)
  services/                    # Dio API client with retry + ApiError
  theme/                       # Config-driven theming (app_config.dart)
  features/
    home/                      # "Your Podcast Feed" (audio_status=ready)
    explore/                   # All posts with search/filter/sort
    post/                      # Post detail + markdown rendering
    generate/                  # Generation trigger + polling + banner
    player/                    # Audio engine + mini/expanded player
    playlist/                  # Queue management with reorder
    status/                    # Dashboard + crawl status
```

### Key Design Decisions

**Config-driven theming**: ALL colors, spacing, typography, and behavioral constants live in `lib/theme/app_config.dart`. No hardcoded values in widgets. Change the theme from one file.

**Riverpod state management**: StateNotifier for complex state (audio player, filters, generation), FutureProvider for API calls. Clean separation of UI and logic.

**Freezed models**: Immutable data classes with automatic JSON serialization. `build.yaml` configures global snake_case field renaming.

**Dio with retry**: 3 attempts, exponential backoff (500ms * 2^n), 10s timeout. Retries on 5xx and 429.

**Feature-based organization**: Each feature is self-contained with its own screen, provider, and widgets. No cross-feature imports except through core/models/services.

## API Endpoints Used

| Method | Path | Used By |
|-|-|-|
| GET | /api/posts | Home, Explore |
| GET | /api/posts/{id} | Post Detail |
| GET | /api/playlist | Playlist |
| GET | /api/tags | Explore filters |
| GET | /api/sources | Explore filters |
| GET | /api/status | Status dashboard |
| GET | /api/crawl-status | Status dashboard |
| GET | /api/jobs | Generation polling |
| POST | /api/crawl | Status + Share intent |
| POST | /api/generate | Generate buttons |

## Tech Stack

| Layer | Technology |
|-|-|
| Framework | Flutter 3.41 (Dart 3.11) |
| State | Riverpod + freezed |
| HTTP | Dio (retry + backoff) |
| Audio | just_audio + audio_service |
| Routing | go_router (ShellRoute) |
| Markdown | flutter_markdown |
| Persistence | shared_preferences |
| Share | receive_sharing_intent |

## File Count

- **54 hand-written Dart files**
- **21 auto-generated files** (freezed + json_serializable)
- **0 analysis warnings** (`flutter analyze`)
- **All tests passing** (`flutter test`)

## Development

```bash
# After changing models
dart run build_runner build --delete-conflicting-outputs

# Analysis
flutter analyze

# Tests
flutter test

# Build APK
flutter build apk --debug
```
