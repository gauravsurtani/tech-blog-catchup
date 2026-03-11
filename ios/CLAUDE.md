# CLAUDE.md — iOS App

## What This Is

Native SwiftUI iOS app for Tech Blog Catchup. Consumes the FastAPI backend at `http://localhost:8000`. iOS 17.0+ target.

## Project Structure

```
ios/TechBlogCatchup/
  Config/       — AppConfig.swift (behavior), ThemeConfig.swift (visuals)
  Theme/        — AppTheme.swift, ThemeEnvironment.swift, ThemedComponents.swift
  Models/       — Codable structs matching backend Pydantic schemas
  Services/     — APIClient.swift (URLSession), AudioPlayerService.swift (AVPlayer)
  Features/     — Home/, Explore/, PostDetail/, Generate/, Player/, Playlist/, Status/
  Components/   — Shared reusable views
  Extensions/   — Color+Hex, Date+Formatting
  Resources/    — Assets.xcassets
```

## Build Commands

```bash
# Generate Xcode project (requires xcodegen)
cd ios && xcodegen generate

# Build
xcodebuild -project TechBlogCatchup.xcodeproj -scheme TechBlogCatchup -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' build

# Test
xcodebuild -project TechBlogCatchup.xcodeproj -scheme TechBlogCatchup -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16' test
```

## Key Conventions

- **Config is king**: `AppConfig.swift` for behavior, `ThemeConfig.swift` for visuals. Change these files to change the entire app.
- **Theme flow**: `ThemeConfig` (raw values) -> `AppTheme` (SwiftUI types) -> `@Environment(\.theme)` (view access). No view should use raw Color literals.
- **@Observable**: All ViewModels use `@Observable` macro (iOS 17+), NOT `ObservableObject`.
- **Codable**: All models use `CodingKeys` with snake_case mapping. Dates decoded with `.iso8601` strategy.
- **API response format**: Backend uses `snake_case` JSON keys. iOS models map to camelCase Swift properties via CodingKeys.
- **Audio lifecycle**: pending -> processing -> ready | failed. Show "Generate Podcast" for pending AND failed.
- **No mutation**: Create new objects, never mutate in place.

## Dependencies

Only 1 external package: `swift-markdown-ui` via SPM.

## Backend API

The FastAPI backend runs at `http://localhost:8000`. All endpoints prefixed `/api/`. Audio files at `/audio/{filename}`.

See SPEC.md for complete API contract.

## Common Tasks

### Add a new API endpoint
1. Add method to `Services/APIClient.swift`
2. Add response model to `Models/` if needed
3. Add ViewModel method in relevant `Features/` folder

### Change theme colors
1. Edit `Config/ThemeConfig.swift` hex values
2. That's it. AppTheme reads from ThemeConfig automatically.

### Add a new screen
1. Create `Features/NewScreen/NewScreenView.swift` and `NewScreenViewModel.swift`
2. ViewModel: `@Observable`, inject APIClient, expose published state
3. View: use `@Environment(\.theme)` for all styling
4. Add tab or navigation link in ContentView.swift
