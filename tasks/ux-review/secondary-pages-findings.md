# UX Review: Secondary Pages, Auth, Overlays

**Scope**: Login, signup, settings, profile, onboarding, landing, library, playlist, search dialog, share button, user menu, full-screen player, status, 404, about
**Reviewed**: 23 component files + visual notes
**Date**: 2026-03-02

---

## Issues Found: 15

### CRITICAL

#### 1. ListeningStats fires N+1 API calls on mount — profile page can hammer backend
**File**: `frontend/src/components/ListeningStats.tsx` (lines 148-169)
**Problem**: For every entry in `localStorage` playback positions, `getPost(id)` is called individually via `Promise.allSettled`. This happens twice — once for completed posts (up to 10) and once for ALL listened posts. A user with 50 listened posts triggers 60 sequential API calls on profile load.
**Fix**: Add a batch endpoint `GET /api/posts?ids=1,2,3` or at minimum deduplicate the two fetch loops (completed posts are a subset of all posts). The current approach will degrade as listening history grows.

#### 2. Landing page has no social proof with real numbers and no secondary CTA
**File**: `frontend/src/app/landing/page.tsx` (lines 133-148)
**Problem**: The "Sources include" section just lists company names as plain text. No user count, no testimonials, no concrete numbers ("500+ podcasts generated"). The single CTA "Start Listening" goes to `/explore` — but there is no sign-up prompt, no email capture, no alternative engagement path for users who are not ready to commit. Per landing page research, social proof with specifics drives 19-34% conversion lift.
**Fix**: Add a stat bar ("15 sources / 200+ podcasts / 50+ hours of audio"). Add a secondary CTA or email capture. Link the source names to their actual blog pages for credibility.

---

### HIGH

#### 3. Settings page provides zero save feedback
**File**: `frontend/src/components/SettingsForm.tsx`
**Problem**: All settings auto-save to localStorage via `updateSetting()`, but the user receives no visual confirmation. After toggling "Auto-play Next" or changing theme, nothing happens — no toast, no "Saved" flash, no checkmark. UX research says users need confirmation that changes persisted, especially for auto-save patterns. A toggle that silently saves feels broken.
**Fix**: Add a brief inline "Saved" toast or a subtle checkmark animation next to the changed setting. Even a 1.5s green flash on the toggle is enough.

#### 4. Onboarding selections are never used downstream
**Files**: `frontend/src/components/onboarding/OnboardingFlow.tsx` (line 23), `SourceSelector.tsx`, `InterestSelector.tsx`
**Problem**: User selects sources and interests, which are saved to `localStorage` under `tbc-user-preferences`. But the home page, explore page, and feed do not read this key to personalize content. The onboarding collects preferences that go unused, violating the "speed to value" principle. Users who pick 3 sources still see all 15 on the feed.
**Fix**: Either wire up preferences to filter the default home feed view, or remove the selection steps and replace with a simpler "here's what you can do" value-prop onboarding.

#### 5. Status page exposes admin operations to all users — no auth guard
**File**: `frontend/src/app/status/page.tsx`
**Problem**: The status page has "Generate Podcasts" and "Crawl All Sources" buttons that trigger backend operations (`triggerCrawl`, `triggerGenerate`). There is no `<AuthGuard>` wrapper, no role check. Any visitor can trigger crawls. The page also uses `console.error` (lines 124, 136, 148) which should use a proper error state.
**Fix**: Wrap in `<AuthGuard>` at minimum, or add an admin role check. Replace `console.error` with user-visible error toasts.

#### 6. Search dialog Escape key conflicts with full-screen player Escape key
**Files**: `SearchDialog.tsx` (Escape via browser default on dialog), `FullScreenPlayer.tsx` (line 148)
**Problem**: Both FullScreenPlayer and the browser's implicit Escape handling on the search dialog listen for Escape. If the search dialog is opened while the full-screen player is active, pressing Escape may close both simultaneously (or only the player). The search dialog does not explicitly handle Escape — it relies on the backdrop click. FullScreenPlayer at z-[70] sits below SearchDialog at z-[100], so the Escape event propagates.
**Fix**: Add explicit `e.stopPropagation()` in the search dialog's Escape handler. Add an `onKeyDown` handler to SearchDialog that calls `onClose` on Escape and stops propagation.

---

### MEDIUM

#### 7. Login page has no loading state on OAuth button click
**File**: `frontend/src/app/login/page.tsx` (lines 53-58)
**Problem**: Clicking "Continue with Google" or "Continue with GitHub" calls `signIn()` which redirects to the OAuth provider. During the redirect (which can take 1-3 seconds), the buttons show no loading indicator. Users may click multiple times thinking nothing happened.
**Fix**: Add a loading state that disables both buttons and shows a spinner on the clicked one while the redirect is in progress.

#### 8. Profile "Member since" is derived from localStorage timestamps, not actual join date
**File**: `frontend/src/app/profile/page.tsx` (lines 12-30)
**Problem**: `getMemberSince()` looks at the earliest `updatedAt` in playback positions localStorage. This means: (a) clearing localStorage resets your "member since" date, (b) a user who signs up but never listens shows no date, (c) the date represents "first listen" not "account creation". The session object likely has a creation date from the OAuth provider.
**Fix**: Use `session.user.createdAt` or similar from the auth provider instead of localStorage heuristics. Fall back to playback data only if auth date is unavailable.

#### 9. PlaylistQueue reorder is hover-only — invisible on touch devices
**File**: `frontend/src/components/PlaylistQueue.tsx` (line 163)
**Problem**: The reorder buttons (ChevronUp/ChevronDown) and the remove button use `opacity-0 group-hover:opacity-100`. On touch devices, hover states don't exist, making these controls permanently invisible. The queue panel has a mobile backdrop (line 42) suggesting mobile use is expected.
**Fix**: Use `opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100` pattern, or better: always show controls on mobile (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`).

#### 10. ShareButton dropdown lacks keyboard navigation and Escape-to-close
**File**: `frontend/src/components/ShareButton.tsx`
**Problem**: The dropdown menu opens on click but has no keyboard handling. No Escape key to close, no arrow key navigation between options, no focus management when the menu opens. The close-on-outside-click uses `mousedown` but there is no equivalent keyboard mechanism.
**Fix**: Add `onKeyDown` handler for Escape to close, auto-focus the first menu item on open, and add arrow key navigation between the three options.

#### 11. UserMenu dropdown opens upward but may clip on short viewports
**File**: `frontend/src/components/UserMenu.tsx` (line 80)
**Problem**: The menu uses `bottom-full` positioning (opens upward from the sidebar user area). If the sidebar user section is near the top of the viewport (e.g., on a short mobile screen or when sidebar is scrolled), the menu clips off-screen with no detection or repositioning logic.
**Fix**: Add viewport boundary detection or use a portal-based dropdown that auto-positions.

#### 12. Signup page is a blind redirect with no value proposition
**File**: `frontend/src/app/signup/page.tsx`
**Problem**: The entire signup page is `redirect("/login")` — a 5-line file. Any link pointing to `/signup` silently redirects to login. This is fine functionally (OAuth has no separate signup), but: (a) users arriving from external links to `/signup` get no context, (b) the redirect is server-side so there is no "Don't have an account? Sign up here" flow distinction.
**Fix**: Either add a brief message on the login page for new users ("New here? Just sign in with Google or GitHub to create your account"), or make the signup route render the login component with a "Create your account" heading variant.

---

### LOW

#### 13. 404 page has no search functionality or suggested content
**File**: `frontend/src/app/not-found.tsx`
**Problem**: The 404 page shows a single "Go Home" button. No search box, no suggested popular posts, no "Did you mean..." guidance. Users who mistyped a URL have no way to find what they were looking for without going back to the home page and starting over.
**Fix**: Add a search input or link to `/explore` as a secondary action. Even "Try searching for what you need" with a link to explore would help.

#### 14. About page uses `prose-invert` which fights with light mode
**File**: `frontend/src/app/about/page.tsx` (line 11)
**Problem**: The content wrapper uses `prose prose-invert` which sets text to white. In light mode with the neo-brutalist theme, this will either be overridden by inline styles (redundant class) or cause invisible white text on light background depending on CSS specificity.
**Fix**: Use `prose dark:prose-invert` to only apply the inverted prose styles in dark mode.

#### 15. FullScreenPlayer gradient map is hardcoded, not aligned with config sources
**File**: `frontend/src/components/FullScreenPlayer.tsx` (lines 20-36)
**Problem**: `SOURCE_GRADIENTS` hardcodes 14 source keys. If a new source is added to `config.yaml` (e.g., "databricks"), it falls through to the "default" gray gradient. The gradient map drifts out of sync with the backend source list over time.
**Fix**: Either generate gradient assignments from the API source list, or use a deterministic hash-based color function that works for any source key without maintenance.

---

## Z-Index Stacking Map

| Layer | z-index | Component |
|-|-|
| Search dialog | z-[100] | SearchDialog.tsx |
| Full-screen player | z-[70] | FullScreenPlayer.tsx |
| Audio player bar | z-50 | AudioPlayer.tsx |
| PlaylistQueue panel | z-50 | PlaylistQueue.tsx |
| ShareButton dropdown | z-50 | ShareButton.tsx |
| UserMenu dropdown | z-50 | UserMenu.tsx |
| Navbar | z-50 | Navbar.tsx |
| Explore mobile filter | z-40/z-50 | explore/page.tsx |

**Risk**: PlaylistQueue, AudioPlayer, ShareButton, and UserMenu all share z-50. PlaylistQueue's backdrop is z-50 and the panel is z-50 — if the audio player is also z-50, the queue panel may not properly overlay it on some browsers. The ShareButton dropdown at z-50 inside a card could appear behind the PlaylistQueue panel.

---

## Summary

| Severity | Count |
|-|-|
| CRITICAL | 2 |
| HIGH | 4 |
| MEDIUM | 6 |
| LOW | 3 |
| **Total** | **15** |

Top 3 quick wins: #3 (save feedback toast), #7 (OAuth loading state), #9 (touch-visible queue controls).
Top 3 high-effort/high-value: #1 (batch API for profile), #4 (wire onboarding to feed), #2 (landing social proof).
