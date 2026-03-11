# Tech Blog Catchup - Android App

## What This Is
Flutter Android app for Tech Blog Catchup. Consumes the existing FastAPI backend (unchanged).
See SPEC.md for full specification.

## Quick Start
```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

## Backend
The app connects to `http://10.0.2.2:8000` (Android emulator default).
Start the backend: `cd ../backend && python3 run.py api --reload`

## Architecture
- State: Riverpod (providers in `lib/core/providers.dart`)
- Models: freezed + json_serializable (`lib/models/`)
- HTTP: Dio with retry interceptor (`lib/services/api_client.dart`)
- Audio: just_audio + audio_service (`lib/features/player/`)
- Routing: go_router with ShellRoute (`lib/app/router.dart`)
- Theme: Material 3 dark, fully configurable via `lib/theme/app_config.dart`

## Key Conventions
- All models use `@freezed` and `@JsonSerializable`
- JSON keys use snake_case from API, Dart uses camelCase via `@JsonKey`
- Providers use `@riverpod` annotation (riverpod_generator)
- After changing models: `dart run build_runner build --delete-conflicting-outputs`
- Feature folders: `lib/features/{feature_name}/`
- Tests mirror `lib/` structure in `test/`
- **Theme is config-driven**: ALL colors, spacing, typography live in `lib/theme/app_config.dart`. Never hardcode color values in widgets.

## API Base URL
Configured in `lib/core/env.dart`. Override at build time:
```bash
flutter run --dart-define=BASE_URL=http://192.168.1.x:8000
```

## File Structure
```
lib/
  main.dart                          # Entry point
  app/                               # App shell, routing, navigation
  core/                              # Providers, env config
  models/                            # freezed data classes
  services/                          # API client, error handling
  theme/                             # app_config.dart (single source of truth for all theming)
  features/
    home/                            # "Your Podcast Feed" (audio_status=ready)
    explore/                         # All posts with search/filter/sort
    post/                            # Post detail + markdown rendering
    generate/                        # Podcast generation trigger + polling
    player/                          # Audio engine, mini/expanded player
    playlist/                        # Queue management
    status/                          # Dashboard + crawl status
```

## Testing
```bash
flutter test                         # all tests
flutter test test/models/            # model tests only
flutter test --coverage              # with coverage report
```
