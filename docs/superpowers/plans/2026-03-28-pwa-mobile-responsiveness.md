# PWA Mobile Responsiveness & UX Overhaul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Catchup a fully responsive, installable PWA that works seamlessly on desktop, tablet, and mobile (iOS Safari + Android Chrome) with proper safe areas, lock screen audio controls, and automated mobile E2E tests.

**Architecture:** Five-phase approach — (1) global CSS/meta foundation, (2) shell component fixes (AudioPlayer, BottomTabs, Sidebar), (3) per-page responsive sweep, (4) MediaSession API + service worker audio fix, (5) Playwright mobile test projects. Each phase builds on the last and is independently deployable.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Playwright, MediaSession API, PWA (manifest + service worker)

---

## File Map

### Phase 1: Global Foundation
| Action | File | Responsibility |
|-|-|-|
| Modify | `frontend/src/app/globals.css` | Safe area CSS vars, `100dvh`, `overscroll-behavior` |
| Modify | `frontend/src/app/layout.tsx` | Apple PWA meta tags, `viewport-fit: cover`, `themeColor` |
| Modify | `frontend/public/manifest.json` | Add `id`, `scope`, `orientation`, maskable icon |
| Modify | `frontend/public/sw.js` | Exclude `/audio/` from cache-first strategy |

### Phase 2: Shell Components
| Action | File | Responsibility |
|-|-|-|
| Modify | `frontend/src/components/AudioPlayer.tsx` | Responsive track info, safe area bottom padding |
| Modify | `frontend/src/components/BottomTabs.tsx` | Safe area inset on height |
| Modify | `frontend/src/components/Sidebar.tsx` | `h-screen` -> `h-dvh` |
| Modify | `frontend/src/components/SidebarLayout.tsx` | `min-h-screen` -> `min-h-dvh` |
| Modify | `frontend/src/components/SearchDialog.tsx` | Mobile positioning, input font size |
| Modify | `frontend/src/components/FullScreenPlayer.tsx` | Responsive padding, artwork sizing |

### Phase 3: Page-by-Page Fixes
| Action | File | Responsibility |
|-|-|-|
| Modify | `frontend/src/app/login/page.tsx` | `min-h-screen` -> `min-h-dvh` |
| Modify | `frontend/src/app/explore/page.tsx` | Filter sidebar `max-w`, main content `min-w-0` |
| Modify | `frontend/src/app/post/[id]/page.tsx` | Title `break-words` |
| Modify | `frontend/src/app/playlist/page.tsx` | Input font `text-base` for iOS |
| Modify | `frontend/src/app/status/page.tsx` | Grid breakpoint refinement |
| Modify | `frontend/src/components/PostCard.tsx` | Touch target 44px, title `break-words` |
| Modify | `frontend/src/components/PostListItem.tsx` | Touch target 44px |

### Phase 4: Audio & PWA Features
| Action | File | Responsibility |
|-|-|-|
| Modify | `frontend/src/hooks/useAudioPlayer.tsx` | MediaSession API integration |

### Phase 5: E2E Tests
| Action | File | Responsibility |
|-|-|-|
| Modify | `frontend/playwright.config.ts` | Add mobile/tablet device projects |
| Create | `frontend/e2e/mobile-responsive.spec.ts` | Viewport tests, touch targets, layout verification |
| Create | `frontend/e2e/pwa.spec.ts` | Manifest, SW registration, offline fallback |

---

## Task 1: CSS Foundation — Safe Areas & dvh

**Files:**
- Modify: `frontend/src/app/globals.css:57-58` (player height), `frontend/src/app/globals.css:126-134` (body styles)

- [ ] **Step 1: Add safe area CSS variables and fix body height**

In `globals.css`, update the `:root` block to add safe area variables, update `--player-height`, and fix the body `min-height`:

```css
/* In :root block, after --player-height: 76px; (line 58) — add these lines: */
--safe-bottom: env(safe-area-inset-bottom, 0px);
--safe-top: env(safe-area-inset-top, 0px);
```

```css
/* Replace body block (lines 126-134) with: */
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text-1);
  font-size: 14px;
  line-height: 1.6;
  min-height: 100dvh;
  transition: background 0.25s, color 0.25s;
  overscroll-behavior: none;
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds (Tailwind 4 supports `100dvh` natively)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "feat: add safe area CSS vars and fix body min-height to 100dvh"
```

---

## Task 2: Layout Meta Tags — Apple PWA Support

**Files:**
- Modify: `frontend/src/app/layout.tsx:21-51`

- [ ] **Step 1: Add viewport export and Apple PWA meta tags to layout.tsx**

Next.js 16 has deprecated `viewport` and `themeColor` inside `Metadata`. Use a separate `Viewport` export.

Add this import and export ABOVE the existing `metadata` export:

```typescript
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FF6B6B",
};
```

Then replace the `metadata` export (lines 21-42) with this version (NO `viewport` or `themeColor`):

```typescript
export const metadata: Metadata = {
  title: {
    default: "Catchup",
    template: "%s | Catchup",
  },
  description: "Listen to tech engineering blogs as conversational podcasts",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Catchup",
  },
  openGraph: {
    type: "website",
    siteName: "Catchup",
    title: "Catchup",
    description: "Listen to tech engineering blogs as conversational podcasts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catchup",
    description: "Listen to tech engineering blogs as conversational podcasts",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-192.png", sizes: "180x180", type: "image/png" }],
  },
};
```

- [ ] **Step 2: Update body class to use dvh**

Replace `min-h-screen` with `min-h-dvh` in the body className (line 51):

```tsx
<body className={`${dmSans.variable} font-[var(--font)] bg-[var(--bg)] text-[var(--text-1)] min-h-dvh`}>
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: Build succeeds. Check that the generated HTML includes apple-mobile-web-app-capable meta tag.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/layout.tsx
git commit -m "feat: add Apple PWA meta tags, viewport-fit cover, and theme color"
```

---

## Task 3: Manifest & Service Worker Fixes

**Files:**
- Modify: `frontend/public/manifest.json`
- Modify: `frontend/public/sw.js`

- [ ] **Step 1: Update manifest.json with missing fields**

Note: `/icon-192.png` and `/icon-512.png` are served by Next.js dynamic route handlers (`src/app/icon-192.tsx`, `icon-512.tsx`), not static files in `public/`. This works fine — the manifest references the URL paths and Next.js serves them. The maskable icon reuses `icon-512.png` which is acceptable as a starting point; a dedicated maskable icon with safe zone padding can be added later.

Replace entire `manifest.json`:

```json
{
  "id": "/",
  "name": "Catchup",
  "short_name": "Catchup",
  "description": "Listen to tech engineering blogs as conversational podcasts",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#F7F5F0",
  "theme_color": "#FF6B6B",
  "categories": ["podcast", "news", "education"],
  "icons": [
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" },
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Fix service worker to exclude audio from cache**

Replace entire `sw.js`:

```javascript
const CACHE_NAME = "tbc-v2";
const STATIC_ASSETS = ["/", "/favicon.svg", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-only for audio files — don't pollute cache with large MP3s
  if (url.pathname.startsWith("/audio") || url.pathname.endsWith(".mp3")) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
```

- [ ] **Step 3: Commit**

```bash
git add frontend/public/manifest.json frontend/public/sw.js
git commit -m "feat: add manifest PWA fields, exclude audio from SW cache"
```

---

## Task 4: AudioPlayer — Responsive Track Info & Safe Area

**Files:**
- Modify: `frontend/src/components/AudioPlayer.tsx:124,130,132`

- [ ] **Step 1: Add safe area bottom padding and fix track info width**

Line 124 — add safe area padding to the fixed container. Change:

```tsx
className="fixed bottom-0 left-0 right-0 z-50 h-[76px] select-none border-t-[var(--border-w)] border-[var(--border-color)]"
```

to:

```tsx
className="fixed bottom-0 left-0 right-0 z-50 select-none border-t-[var(--border-w)] border-[var(--border-color)]"
style={{
  backgroundColor: "var(--player-bg)",
  boxShadow: "var(--player-shadow)",
  paddingBottom: "var(--safe-bottom)",
}}
```

Remove the duplicate `style` prop on line 125-128 (merge into the one above).

Line 130 — add height to inner container instead:

```tsx
<div className="h-[76px] max-w-full mx-auto px-4 flex items-center gap-4">
```

Line 132 — make track info responsive. Change:

```tsx
<div className="flex flex-col min-w-0 w-56 shrink-0" aria-live="polite">
```

to:

```tsx
<div className="flex flex-col min-w-0 w-40 sm:w-56 shrink-0" aria-live="polite">
```

- [ ] **Step 2: Verify no layout breakage**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AudioPlayer.tsx
git commit -m "fix: responsive AudioPlayer track info and safe area bottom padding"
```

---

## Task 5: BottomTabs — Safe Area Inset

**Files:**
- Modify: `frontend/src/components/BottomTabs.tsx:22-27`

- [ ] **Step 1: Add safe area to BottomTabs height**

Replace the inline style (line 23-27):

```tsx
style={{
  bottom: "var(--player-height)",
  zIndex: "var(--z-nav)",
  height: "3.5rem",
}}
```

with:

```tsx
style={{
  bottom: "calc(var(--player-height) + var(--safe-bottom))",
  zIndex: "var(--z-nav)",
  height: "3.5rem",
}}
```

Note: No `paddingBottom` needed here — the AudioPlayer (Task 4) already handles the safe area inset with its own `paddingBottom`. BottomTabs just needs to position itself above the AudioPlayer's new effective height.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/BottomTabs.tsx
git commit -m "fix: add safe area inset to BottomTabs for notched devices"
```

---

## Task 6: Sidebar & SidebarLayout — dvh Fix

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx:70`
- Modify: `frontend/src/components/SidebarLayout.tsx:53`

- [ ] **Step 1: Fix Sidebar height**

Line 70 — change `h-screen` to `h-dvh`:

```tsx
className="hidden md:flex flex-col fixed top-0 left-0 h-dvh pb-[var(--player-height)] border-r-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg-elevated)] transition-[width] duration-300 ease-in-out"
```

- [ ] **Step 2: Fix SidebarLayout min-height**

Line 53 — change `min-h-screen` to `min-h-dvh`:

```tsx
className="flex flex-col min-h-dvh bg-[var(--bg)] text-[var(--text-1)] transition-[margin-left] duration-300 ease-in-out"
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Sidebar.tsx frontend/src/components/SidebarLayout.tsx
git commit -m "fix: use dvh instead of vh for Sidebar and SidebarLayout heights"
```

---

## Task 7: SearchDialog — Mobile Positioning & Input Font

**Files:**
- Modify: `frontend/src/components/SearchDialog.tsx:217,244`

- [ ] **Step 1: Fix dialog positioning for mobile**

Line 217 — change `pt-[15vh]` to mobile-safe value:

```tsx
className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-[15vh]"
```

- [ ] **Step 2: Fix input font size to prevent iOS zoom**

Line 244 — change `text-sm` to `text-base`:

```tsx
className="flex-1 py-3.5 bg-transparent text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none text-base border-none shadow-none"
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SearchDialog.tsx
git commit -m "fix: mobile search dialog positioning and iOS input zoom prevention"
```

---

## Task 8: FullScreenPlayer — Responsive Padding & Artwork

**Files:**
- Modify: `frontend/src/components/FullScreenPlayer.tsx:210,253,282,292`

- [ ] **Step 1: Fix top bar padding**

Line 210 — change `px-6` to responsive:

```tsx
<div className="flex items-center justify-between px-4 sm:px-6 pt-6 pb-2">
```

- [ ] **Step 2: Fix artwork area padding**

Line 253 — change `px-8` to responsive:

```tsx
<div className="flex-1 flex items-center justify-center px-4 sm:px-8 min-h-0">
```

- [ ] **Step 3: Fix artwork sizing on small screens**

Line 282 — the artwork `w-64 h-64 sm:w-80 sm:h-80` is fine for 375px+ devices. No change needed (320px devices are edge case, and `w-64` = 256px fits with `px-4` = 32px total = 288px < 320px).

- [ ] **Step 4: Fix track info padding**

Line 292 — change `px-8` to responsive:

```tsx
<div className="px-4 sm:px-8 pb-4 text-center">
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/FullScreenPlayer.tsx
git commit -m "fix: responsive padding in FullScreenPlayer for mobile screens"
```

---

## Task 9: Login Page — dvh Fix

**Files:**
- Modify: `frontend/src/app/login/page.tsx:28`

- [ ] **Step 1: Fix min-h-screen to min-h-dvh**

Line 28:

```tsx
<div className="min-h-dvh flex items-center justify-center px-4 bg-[var(--bg)]">
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/login/page.tsx
git commit -m "fix: use min-h-dvh on login page for iOS viewport"
```

---

## Task 10: Explore Page — Filter Sidebar Overflow Fix

**Files:**
- Modify: `frontend/src/app/explore/page.tsx:196,208`

- [ ] **Step 1: Add min-w-0 to main flex container**

Line 196 — add `min-w-0` to prevent flex overflow:

```tsx
<div className="flex gap-6 min-w-0">
```

- [ ] **Step 2: Cap filter sidebar width on small screens**

Line 208 — add `max-w-[85vw]` for safety:

```tsx
className={`
  fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-[var(--bg)] border-r border-[var(--border-color)] z-50
  transform transition-transform duration-200 ease-in-out overflow-y-auto
  lg:static lg:transform-none lg:z-auto lg:h-auto lg:border-r-0 lg:w-64 lg:max-w-none lg:flex-shrink-0
  ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
`}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/explore/page.tsx
git commit -m "fix: prevent explore page filter sidebar overflow on small screens"
```

---

## Task 11: Post Detail — Title Word Break

**Files:**
- Modify: `frontend/src/app/post/[id]/page.tsx:202`

- [ ] **Step 1: Add break-words to title**

Line 202:

```tsx
<h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-1)] leading-tight flex-1 break-words">
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/post/[id]/page.tsx
git commit -m "fix: prevent long post titles from overflowing on mobile"
```

---

## Task 12: Playlist Page — iOS Input Zoom Fix

**Files:**
- Modify: `frontend/src/app/playlist/page.tsx:110`

- [ ] **Step 1: Fix input font size**

Line 110 — change `text-sm` to `text-base sm:text-sm`:

```tsx
className="bg-[var(--tag-bg)] border-[var(--border-w)] border-[var(--border-color)] text-[var(--text-1)] text-base sm:text-sm rounded-[var(--radius)] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent w-48"
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/playlist/page.tsx
git commit -m "fix: prevent iOS auto-zoom on playlist name input"
```

---

## Task 13: Touch Targets — PostCard & PostListItem

**Files:**
- Modify: `frontend/src/components/PostCard.tsx:109,133`
- Modify: `frontend/src/components/PostListItem.tsx:43,47,52,57,64`

- [ ] **Step 1: Fix PostCard play button to 44px**

Line 109 — change `w-[42px] h-[42px]` to `w-11 h-11`:

```tsx
className="inline-flex items-center justify-center w-11 h-11 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] rounded-full border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] nb-hover transition-all cursor-pointer"
```

Line 133 — fix queue button (34px is too small, bump to 36px minimum but 44px ideal for touch):

```tsx
className="inline-flex items-center justify-center w-9 h-9 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-all cursor-pointer"
```

- [ ] **Step 2: Fix PostCard title for word breaking**

Find the title element (around line 47) and add `break-words`:

Look for the `<h3>` or title span and add `break-words` class.

- [ ] **Step 3: Fix PostListItem play/action buttons to 44px**

Line 43 container uses `w-10` (not `w-[42px]`) — change to `w-11`. Lines 47, 52, 57-58, 64 use `w-[42px] h-[42px]` — change to `w-11 h-11`:

```tsx
/* Line 43 - container: was w-10 (40px), change to w-11 (44px) */
<div className="flex-shrink-0 w-11">

/* Line 47 - play button */
className="w-11 h-11 flex items-center justify-center bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] rounded-full border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] nb-hover transition-all cursor-pointer"

/* Line 52 - processing spinner container */
<div className="w-11 h-11 flex items-center justify-center">

/* Line 57-58 - generate button */
className="w-11 h-11 flex items-center justify-center bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] rounded-full border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] nb-hover transition-all cursor-pointer"

/* Line 64 - empty placeholder */
<div className="w-11 h-11" />
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/PostCard.tsx frontend/src/components/PostListItem.tsx
git commit -m "fix: increase touch targets to 44px minimum on PostCard and PostListItem"
```

---

## Task 14: MediaSession API — Lock Screen Controls

**Files:**
- Modify: `frontend/src/hooks/useAudioPlayer.tsx:484-490` (handlePlay/handlePause callbacks)

- [ ] **Step 1: Add MediaSession metadata update helper**

Add this function inside the `AudioPlayerProvider` component, after the `loadAndPlay` callback (around line 259):

```typescript
// Update MediaSession for lock screen controls
const updateMediaSession = useCallback((track: Post | null, playing: boolean) => {
  if (!("mediaSession" in navigator) || !track) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.source_name || "Catchup",
    album: "Catchup",
    artwork: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  });

  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}, []);
```

- [ ] **Step 2: Register MediaSession action handlers**

Add a `useEffect` after the existing keyboard shortcut effect (find the `useEffect` with `handleKeyDown` — around line 440). Add this new effect:

```typescript
// Register MediaSession action handlers for lock screen / headphone controls
useEffect(() => {
  if (!("mediaSession" in navigator)) return;

  const audio = audioRef.current;

  navigator.mediaSession.setActionHandler("play", () => {
    audio?.play().catch(() => {});
    setIsPlaying(true);
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    audio?.pause();
    setIsPlaying(false);
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    previous();
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    if (queue.length > 0) next();
  });
  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
  });
  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (details.seekOffset || 10));
  });
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (!audio || details.seekTime == null) return;
    audio.currentTime = details.seekTime;
  });

  return () => {
    // Clean up handlers
    const actions: MediaSessionAction[] = ["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"];
    actions.forEach((action) => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch {}
    });
  };
}, [next, previous, queue.length]);
```

- [ ] **Step 3: Update position state on timeupdate**

In the `handleTimeUpdate` callback (line 443-450), add position state reporting:

```typescript
const handleTimeUpdate = useCallback(() => {
  const audio = audioRef.current;
  if (!audio) return;
  setCurrentTime(audio.currentTime);
  if (audio.duration && isFinite(audio.duration)) {
    setProgress(audio.currentTime / audio.duration);
    // Report position to MediaSession for lock screen scrubber
    if ("mediaSession" in navigator && navigator.mediaSession.setPositionState) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch {}
    }
  }
}, []);
```

- [ ] **Step 4: Update MediaSession when track changes**

Note: This effect handles all MediaSession sync — no need to also call `updateMediaSession` in `handlePlay`/`handlePause` callbacks (the effect reacts to `isPlaying` changes automatically).

Add effect after `updateMediaSession` definition:

```typescript
// Sync MediaSession when track changes
useEffect(() => {
  updateMediaSession(currentTrack, isPlaying);
}, [currentTrack, isPlaying, updateMediaSession]);
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useAudioPlayer.tsx
git commit -m "feat: add MediaSession API for lock screen audio controls"
```

---

## Task 15: Playwright Mobile Device Projects

**Files:**
- Modify: `frontend/playwright.config.ts`

- [ ] **Step 1: Add mobile and tablet device projects**

Replace entire `playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "Tablet",
      use: { ...devices["iPad Pro 11"] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/playwright.config.ts
git commit -m "feat: add mobile and tablet device projects to Playwright config"
```

---

## Task 16: Mobile Responsive E2E Tests

**Files:**
- Create: `frontend/e2e/mobile-responsive.spec.ts`

- [ ] **Step 1: Write mobile layout verification tests**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Mobile Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
  });

  test("bottom tabs visible on mobile, hidden on desktop", async ({ page, isMobile }) => {
    const bottomTabs = page.locator('nav[aria-label="Mobile navigation"]');
    if (isMobile) {
      await expect(bottomTabs).toBeVisible();
    } else {
      await expect(bottomTabs).toBeHidden();
    }
  });

  test("sidebar visible on desktop, hidden on mobile", async ({ page, isMobile }) => {
    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    if (isMobile) {
      await expect(sidebar).toBeHidden();
    } else {
      await expect(sidebar).toBeVisible();
    }
  });

  test("no horizontal overflow on mobile", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
  });

  test("touch targets meet 44px minimum", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    // Check bottom tab links
    const tabLinks = page.locator('nav[aria-label="Mobile navigation"] a');
    const count = await tabLinks.count();
    for (let i = 0; i < count; i++) {
      const box = await tabLinks.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("main content not clipped by fixed elements", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    const main = page.locator("#main-content");
    const mainBox = await main.boundingBox();
    expect(mainBox).not.toBeNull();
    if (mainBox) {
      // Main content should start at top of visible area (below any fixed header)
      expect(mainBox.y).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe("Mobile Navigation", () => {
  test("bottom tabs navigate to correct pages", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    await page.goto("/");
    await page.waitForLoadState("load");

    // Navigate to Explore via bottom tab
    await page.locator('nav[aria-label="Mobile navigation"] a[href="/explore"]').click();
    await expect(page).toHaveURL(/\/explore/);

    // Navigate to Library via bottom tab
    await page.locator('nav[aria-label="Mobile navigation"] a[href="/library"]').click();
    await expect(page).toHaveURL(/\/library/);
  });
});

test.describe("Search Dialog Mobile", () => {
  test("search dialog is usable on mobile viewport", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    await page.goto("/");

    // Open search via bottom area or Cmd+K
    await page.keyboard.press("Meta+k");
    const dialog = page.locator('div[role="dialog"][aria-label="Search"]');
    await expect(dialog).toBeVisible();

    // Input should be visible and focusable
    const input = dialog.locator("input");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // Dialog should not overflow viewport
    const dialogBox = await dialog.locator(".relative.w-full").boundingBox();
    if (dialogBox) {
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(dialogBox.width).toBeLessThanOrEqual(viewportWidth);
    }
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/e2e/mobile-responsive.spec.ts
git commit -m "test: add mobile responsive E2E tests for layout and navigation"
```

---

## Task 17: PWA E2E Tests

**Files:**
- Create: `frontend/e2e/pwa.spec.ts`

- [ ] **Step 1: Write PWA validation tests**

```typescript
import { test, expect } from "@playwright/test";

test.describe("PWA Configuration", () => {
  test("manifest.json is valid and accessible", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe("Catchup");
    expect(manifest.short_name).toBe("Catchup");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.id).toBe("/");
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();

    // Verify required icon sizes
    const iconSizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(iconSizes).toContain("192x192");
    expect(iconSizes).toContain("512x512");

    // Verify maskable icon exists
    const maskable = manifest.icons.find((i: { purpose?: string }) => i.purpose === "maskable");
    expect(maskable).toBeTruthy();
  });

  test("service worker is registered", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");

    const swRegistered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });
    expect(swRegistered).toBe(true);
  });

  test("apple PWA meta tags are present", async ({ page }) => {
    await page.goto("/");

    // Check apple-mobile-web-app-capable
    const capable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(capable).toHaveAttribute("content", "yes");

    // Check theme-color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute("content");

    // Check viewport has viewport-fit=cover
    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute("content");
    expect(content).toContain("viewport-fit=cover");
  });

  test("manifest link is in head", async ({ page }) => {
    await page.goto("/");
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/e2e/pwa.spec.ts
git commit -m "test: add PWA configuration E2E tests"
```

---

## Task 18: Status Page Grid Fix

**Files:**
- Modify: `frontend/src/app/status/page.tsx`

- [ ] **Step 1: Improve grid breakpoints**

Find the stats grid (uses `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`) and change to:

```tsx
className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
```

This gives more room at the `md` (768px) breakpoint where 5 columns would be too cramped.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/status/page.tsx
git commit -m "fix: improve status page grid breakpoints for tablet viewports"
```

---

## Task 19: Final Build Verification

- [ ] **Step 1: Run full build**

Run: `cd frontend && npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `cd frontend && npm run lint 2>&1 | tail -10`
Expected: No new lint errors.

- [ ] **Step 3: Run E2E tests (desktop only for now)**

Run: `cd frontend && npx playwright test --project="Desktop Chrome" 2>&1 | tail -20`
Expected: Existing tests pass.

- [ ] **Step 4: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: address lint and build issues from PWA overhaul"
```

---

## Verification Checklist

After all tasks are complete, verify manually or via Playwright:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Desktop Chrome: Sidebar visible, AudioPlayer at bottom
- [ ] Mobile Chrome (Pixel 7): BottomTabs visible, Sidebar hidden, no horizontal scroll
- [ ] Mobile Safari (iPhone 14): Same as above, plus no iOS zoom on inputs
- [ ] Search dialog positions correctly on mobile
- [ ] AudioPlayer track info doesn't overflow on 375px width
- [ ] manifest.json has all required fields
- [ ] Service worker excludes audio from cache
- [ ] Apple PWA meta tags present in page source
- [ ] MediaSession metadata updates when track changes (check Chrome DevTools > Application > Media)
