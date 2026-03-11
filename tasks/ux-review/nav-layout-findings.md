# Navigation & Layout UX Review

## Critical Issues (blocks usability)

### 1. Mobile: Content hidden behind stacked BottomTabs + AudioPlayer
- **What**: On mobile, BottomTabs (56px) sits above AudioPlayer (76px) = 132px total fixed at bottom. Main content only has `pb-24` (96px) padding, leaving ~36px of content permanently obscured.
- **Why it matters**: Users can't read the last items in any list/feed. They'll think the page is broken.
- **Fix**: Set `pb-[calc(var(--player-height)+3.5rem+1rem)]` on `<main>` for mobile, or ~148px. Use a responsive class: `pb-24 md:pb-24` becomes `pb-[9.5rem] md:pb-24`.
- **Files**: `frontend/src/app/layout.tsx` (line 67)

### 2. AudioPlayer z-index hardcoded, conflicts with CSS scale
- **What**: AudioPlayer uses Tailwind `z-50` (z-index: 50) while the design system defines `--z-player: 50` and `--z-nav: 40`. But the ThemeToggle also uses `z-50` (line 64, layout.tsx). FullScreenPlayer and modals can collide.
- **Why it matters**: The ThemeToggle floats at z-50 same as the player — on short viewports they overlap. Hardcoded values defeat the z-index scale purpose.
- **Fix**: Replace `z-50` on AudioPlayer with `z-[var(--z-player)]`. Replace ThemeToggle's `z-50` with `z-[var(--z-nav)]` or lower since it's a utility button, not primary navigation.
- **Files**: `frontend/src/components/AudioPlayer.tsx` (line 97), `frontend/src/app/layout.tsx` (line 64)

### 3. Volume slider has no keyboard support
- **What**: The volume `div[role="slider"]` has `tabIndex={0}` and ARIA attributes, but zero `onKeyDown` handler. Arrow keys won't adjust volume when focused on the slider itself.
- **Why it matters**: Screen reader and keyboard-only users can focus the slider but can't operate it — WCAG 2.1 SC 4.1.2 failure.
- **Fix**: Add `onKeyDown` handler: ArrowRight/Up = +5%, ArrowLeft/Down = -5%, Home = 0%, End = 100%.
- **Files**: `frontend/src/components/AudioPlayer.tsx` (lines 179-196)

## High Priority (hurts experience)

### 4. BottomTabs missing "Browse" — nav mismatch with Sidebar
- **What**: Sidebar has 6 items (Home, Explore, Browse, Library, Playlist, Status). BottomTabs has 5 — "Browse" is dropped. Mobile users can't access the Browse page from nav.
- **Why it matters**: Feature is unreachable on mobile without direct URL. Violates consistency principle.
- **Fix**: Either add Browse to BottomTabs (6 tabs is borderline — consider merging Browse into Explore), or use a "More" overflow tab for Status+Browse.
- **Files**: `frontend/src/components/BottomTabs.tsx` (lines 7-13)

### 5. Player height mismatch: CSS var vs actual
- **What**: `--player-height: 5rem` (80px) is used by Sidebar (`pb-[var(--player-height)]`) and BottomTabs (`bottom: var(--player-height)`) to position above the player. But AudioPlayer actual height is `h-[76px]` — a 4px gap.
- **Why it matters**: Visible 4px gap between BottomTabs and AudioPlayer on mobile. Sidebar nav items get clipped slightly differently than expected.
- **Fix**: Either change AudioPlayer to `h-[var(--player-height)]` or update `--player-height` to `76px`. Using the CSS var is the clean approach.
- **Files**: `frontend/src/components/AudioPlayer.tsx` (line 97), `frontend/src/app/globals.css` (line 58)

### 6. Footer obscured when AudioPlayer is active
- **What**: Footer renders inside `SidebarLayout` at the bottom of content flow. When AudioPlayer is visible (76px fixed bottom), the footer's bottom portion is hidden behind it. No conditional padding.
- **Why it matters**: Copyright, About, Terms, Privacy links are partly or fully hidden — legal/accessibility concern.
- **Fix**: Add `pb-[var(--player-height)]` to Footer, or wrap footer content in a container with bottom padding when `currentTrack` exists. Alternatively, hide Footer entirely when player is active (Spotify pattern).
- **Files**: `frontend/src/components/Footer.tsx`, `frontend/src/app/layout.tsx`

### 7. Sidebar `role="list"` on `<nav>` is incorrect ARIA
- **What**: The `<nav>` element on line 106 of Sidebar has `role="list"` but contains `<a>` elements, not `<li>` items. The outer `<aside>` already has `role="navigation"`, making the inner `<nav>` redundant.
- **Why it matters**: Screen readers announce "list" but find no list items — confusing for assistive tech users.
- **Fix**: Remove `role="list"` from the inner `<nav>`. The `<aside role="navigation">` already provides the landmark. Or convert to `<ul>` + `<li>` for proper list semantics.
- **Files**: `frontend/src/components/Sidebar.tsx` (line 106)

### 8. BottomTabs has no ARIA landmark or label
- **What**: BottomTabs `<nav>` has no `aria-label`. Two `<nav>` elements exist (sidebar + bottom tabs) with no way for screen readers to distinguish them.
- **Why it matters**: Screen reader users navigating by landmarks hear "navigation" twice with no differentiation.
- **Fix**: Add `aria-label="Mobile navigation"` to BottomTabs `<nav>`.
- **Files**: `frontend/src/components/BottomTabs.tsx` (line 19)

## Medium Priority (polish)

### 9. ThemeToggle position blocks content on mobile
- **What**: ThemeToggle is `fixed top-4 right-4 z-50` — always floating. On mobile it overlaps page content/headings. On Explore page, it sits on top of the sort dropdown.
- **Why it matters**: Floating buttons feel like ads or chat widgets. Blocks interactive elements underneath.
- **Fix**: Move ThemeToggle into the Sidebar (below logo or above collapse toggle) for desktop, and into BottomTabs "more" menu or a settings page for mobile. Remove the fixed positioning.
- **Files**: `frontend/src/app/layout.tsx` (line 64), `frontend/src/components/ThemeToggle.tsx`

### 10. Sidebar collapsed width (72px) exceeds best-practice range
- **What**: Collapsed sidebar is 72px. Industry standard (Spotify, Discord, Figma) is 48-64px for icon-only sidebars.
- **Why it matters**: Extra 8-24px of wasted horizontal space on every page, reducing content area on smaller desktops (1024-1280px).
- **Fix**: Reduce to 56-64px. Adjust icon container padding to match.
- **Files**: `frontend/src/components/Sidebar.tsx` (line 148), `frontend/src/components/SidebarLayout.tsx` (line 49)

### 11. No active-route indicator on BottomTabs for nested routes
- **What**: Active matching uses `pathname.startsWith(href)` which works, but `/post/[id]` pages don't highlight any tab since they don't start with any tab href.
- **Why it matters**: User navigates to a post detail and loses their place — no tab appears active. They don't know where they "are" in the app.
- **Fix**: Add fallback logic: if no tab matches, highlight the tab for the referrer route, or default to "Home". Alternatively, map `/post/*` to "Home" or "Explore" depending on origin.
- **Files**: `frontend/src/components/BottomTabs.tsx`, `frontend/src/components/Sidebar.tsx`

### 12. GenerationBanner lacks dismiss/close action
- **What**: The banner auto-shows when a job is running and auto-hides when done. No way to dismiss it manually.
- **Why it matters**: During long generation jobs (minutes), the banner permanently takes screen real estate. Users who triggered it intentionally don't need the constant reminder.
- **Fix**: Add an X close button with `aria-label="Dismiss"`. Store dismissed state for the current job ID so it doesn't reappear for the same job.
- **Files**: `frontend/src/components/GenerationBanner.tsx`

## Low Priority (nice to have)

### 13. Sidebar collapse toggle has no visible label
- **What**: The collapse button at sidebar bottom is just a chevron icon. No tooltip on hover (only `aria-label`).
- **Why it matters**: New users may not discover the toggle. It's not immediately obvious what the chevron does.
- **Fix**: Add `title` attribute matching the aria-label ("Collapse sidebar" / "Expand sidebar") for hover tooltip.
- **Files**: `frontend/src/components/Sidebar.tsx` (lines 133-139)

### 14. Footer nav links lack `aria-current` for active route
- **What**: Footer links (About, Terms, Privacy) have no active state indication when on those pages.
- **Why it matters**: Minor — these are low-traffic pages. But for completeness, active link should be visually distinct.
- **Fix**: Add pathname check and `aria-current="page"` + visual active style.
- **Files**: `frontend/src/components/Footer.tsx`

### 15. SidebarLayout uses window event for state sync instead of React context
- **What**: Sidebar dispatches `CustomEvent("sidebar-toggle")` and SidebarLayout listens via `addEventListener`. This is a DOM-level workaround for shared state.
- **Why it matters**: Fragile coupling. If a third component needs sidebar state, another event listener is needed. React context or Zustand would be cleaner.
- **Fix**: Extract sidebar collapsed state into a shared context provider. Both Sidebar and SidebarLayout consume it. Removes custom event plumbing.
- **Files**: `frontend/src/components/Sidebar.tsx`, `frontend/src/components/SidebarLayout.tsx`

## Best Practices Researched
- [Elinext - Best UX/UI Design for Podcast Apps](https://www.elinext.com/services/ui-ux-design/trends/best-ux-ui-design-for-podcast-apps/): Core controls (play/pause/skip) must be instantly accessible and universally recognizable. Sticky player is essential.
- [Sonogram - Podcast Player Interfaces](https://sonogram.mgedinso.com/blog/designing-visually-appealing-and-user-friendly-podcast-player-interfaces): Consistency of interactive elements across screens. Analytics-driven iteration.
- [UX Planet - Sidebar Best Practices](https://uxplanet.org/best-ux-practices-for-designing-a-sidebar-9174ee0ecaa2): Collapsed width 48-64px. Always pair icons with text labels. Active state must be unambiguous.
- [UI/UX Design Trends - Sidebar 2025](https://uiuxdesigntrends.com/best-ux-practices-for-sidebar-menu-in-2025/): 70% of users rely on sidebar for navigation. Context-aware sidebars improve task completion.
- [Alfdesigngroup - Sidebar Design 2026](https://www.alfdesigngroup.com/post/improve-your-sidebar-design-for-web-apps): Recommended 240-300px expanded, 48-64px collapsed. z-index scale must be consistent.
- [WCAG 2.1 SC 4.1.2](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html): All interactive components must be operable via keyboard.
