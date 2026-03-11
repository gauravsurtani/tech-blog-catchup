# UX Fixes — 22 Issues Across 5 Parallel Batches

## Summary

All 5 batches implemented and committed. 22 UX issues resolved. Build passes, backend tests pass (175/175).

## Commits

| Commit | Batch | Changes |
|-|-|-|
| `7fe02a1` | B2 | Sort options, jump-to-page, onboarding prefs, landing stats |
| `abacdf7` | B3 | Auth guard on status, BottomTabs (Browse added, Status removed), login loading, signup page |
| `cca14e5` | B4 | ShareButton keyboard nav, UserMenu viewport flip, Footer aria-current, FullScreenPlayer hash gradients |
| `519216c` | B5 | Sidebar 60px collapsed, better member-since, 404 search link |
| `a52fde3` | B1 | N+1 fix (batch fetch), formatters extraction, audio badges, smart back button |

## Verification

- `npm run build` — all 22 routes compile
- `pytest tests/ -x` — 175 passed
- `getPost(` eliminated from ListeningStats.tsx and ContinueListening.tsx (N+1 fixed)
- `formatDuration` imported (not locally defined) in PostCard.tsx
- Pre-existing lint error in useGenerationStatus.ts (not from our changes)

## Files Changed (27 files across 5 batches)

### Batch 1 (Critical)
- backend/src/api/routes.py — `ids` query param
- frontend/src/lib/api.ts — `ids?: number[]` in PostsParams
- frontend/src/lib/formatters.ts — NEW: shared formatDate/formatDuration/formatWordCount
- frontend/src/components/ListeningStats.tsx — batch fetch
- frontend/src/components/ContinueListening.tsx — batch fetch
- frontend/src/components/PostCard.tsx — formatters import, audio status dots
- frontend/src/components/PostListItem.tsx — formatters import, audio status dots
- frontend/src/components/CarouselCard.tsx — formatters import
- frontend/src/app/post/[id]/page.tsx — formatters import, router.back()
- frontend/src/app/library/page.tsx — formatters import, batch fetch
- frontend/src/components/FullScreenPlayer.tsx — formatDate import

### Batch 2 (High)
- frontend/src/app/explore/page.tsx — sort options, jump-to-page, onboarding prefs
- frontend/src/components/SourceFilter.tsx — filter status text
- frontend/src/app/landing/page.tsx — stat bar, secondary CTA

### Batch 3 (High)
- frontend/src/components/BottomTabs.tsx — Browse tab, removed Status
- frontend/src/app/status/page.tsx — AuthGuard wrapper
- frontend/src/app/login/page.tsx — loading state during OAuth
- frontend/src/app/signup/page.tsx — proper page instead of blind redirect

### Batch 4 (Medium)
- frontend/src/components/ShareButton.tsx — keyboard nav, ARIA
- frontend/src/components/UserMenu.tsx — viewport-aware dropdown
- frontend/src/components/Footer.tsx — client component, aria-current
- frontend/src/components/FullScreenPlayer.tsx — deterministic hash gradients

### Batch 5 (Low)
- frontend/src/components/Sidebar.tsx — 60px collapsed width
- frontend/src/components/SidebarLayout.tsx — matching 60px
- frontend/src/app/profile/page.tsx — session createdAt fallback
- frontend/src/app/not-found.tsx — Search Posts link
