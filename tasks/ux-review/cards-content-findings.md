# Cards & Content Pages UX Review

## Critical Issues

### 1. PostCard action bar is overloaded — 5 actions compete for attention
- **What**: Every PostCard shows Play/Generate + Share + "Add to queue" (with text label) + Heart in a single row. On narrow cards in a 3-col grid, this creates a cramped, visually noisy footer. The "Add to queue" text label wastes ~100px that other elements need.
- **Why it matters**: When everything screams for attention, nothing gets clicked. Spotify/Apple Podcasts show only the primary action (Play) on the card; secondary actions live in a context menu or reveal on hover. NN/G warns neobrutalism must "retain hierarchy" — this footer is flat hierarchy.
- **Fix**: (a) Make Play the only always-visible button. (b) Collapse Share + Queue + Heart into a `...` overflow menu or show on hover. (c) Drop the "Add to queue" text label — icon-only `+` with tooltip is sufficient (PostListItem already does this).
- **Files**: `frontend/src/components/PostCard.tsx` (lines 133-175)

### 2. CarouselCard shows source_name twice — header and footer
- **What**: `source_name` appears at line 32-34 (with Radio icon) AND at line 44 (footer left). Identical text in a 192px-wide card is pure noise.
- **Why it matters**: Wastes 2 of ~5 visible content lines in a small card. Users scanning a "Recently Added" carousel gain zero new info from the duplicate.
- **Fix**: Remove the footer `source_name` (line 44). Keep only the header with the Radio icon. Use the freed footer space for a tag badge or publish date.
- **Files**: `frontend/src/components/CarouselCard.tsx` (line 44)

### 3. No active filter indicators on Explore page — users lose track of state
- **What**: When sources/tags are selected in the sidebar, the main content area shows no filter chips or "active filters" summary. The only signal is the sidebar checkboxes (hidden on mobile behind a drawer).
- **Why it matters**: LogRocket filter UX guide: "Making all applied filters visible to the user will help them better understand how these filters affect their search results." With 14 sources and 12 tags, users forget what's active, especially after scrolling.
- **Fix**: Add a horizontal "applied filters" chip bar above the results grid. Each chip shows the filter name + X to remove. Include a "Clear all" link when any filter is active.
- **Files**: `frontend/src/app/explore/page.tsx` (insert between search bar and results info, ~line 270)

## High Priority

### 4. PostCard summary truncation is too aggressive at 150 chars
- **What**: `truncateSummary` hard-caps at 150 chars. Combined with source + date + title + author + meta + tags + 5 action buttons, the summary gets ~2 lines. Many summaries truncate mid-sentence without context.
- **Why it matters**: The summary is the primary signal for "should I listen to this?" Two truncated lines don't provide enough information scent for deciding among 1125 posts.
- **Fix**: Increase to 200 chars OR use CSS `line-clamp-3` instead of JS truncation — this adapts to card width. Remove the author row from the card (it's low-value metadata that competes with the summary).
- **Files**: `frontend/src/components/PostCard.tsx` (line 43, lines 97-102)

### 5. Explore pagination is number-only — no "jump to page" for 94+ pages
- **What**: With 1125 posts / 12 per page = 94 pages. The pagination shows `1 ... 4 5 6 ... 94` — no way to jump to page 50 or enter a page number.
- **Why it matters**: Users who want posts from months ago must click Next ~40 times. This is a known anti-pattern for large datasets.
- **Fix**: Add a small page-number input ("Go to page ___") next to the pagination controls. Or better: add a date-range filter to the sidebar, reducing the need for deep pagination.
- **Files**: `frontend/src/app/explore/page.tsx` (lines 317-363)

### 6. Explore SourceFilter doesn't indicate "no filters = all sources" semantics
- **What**: When no sources are checked, all posts show (correct behavior). But the UI doesn't communicate this — an empty checkbox list looks like "nothing selected, why am I seeing results?" The "Clear" button is disabled when nothing is selected, but "Select All" is active, creating confusion about state.
- **Why it matters**: Users expect checked = included, unchecked = excluded. The current "none checked = all shown" pattern violates this expectation.
- **Fix**: Add a subtle helper text below the Sources heading: "Showing all sources" when none selected, or "Filtering N sources" when some are checked. Alternatively, use radio-style "All / Selected" toggle at the top.
- **Files**: `frontend/src/components/SourceFilter.tsx` (add helper text ~line 58-59)

### 7. Home page fires 4+ parallel API calls on mount — waterfall risk
- **What**: `Home` renders `ContinueListening` (N individual `getPost()` calls for each localStorage entry) + `HomeSections` (1 `getPosts` + 1 `getSources` + N `getPosts` per top source) + the main `usePosts` hook. A user with 5 continue-listening entries triggers ~10 API calls simultaneously.
- **Why it matters**: On slow connections or cold starts, this creates visible layout shift as sections pop in at different times. The N+1 query pattern in `ContinueListening` (one `getPost` per saved position) is especially wasteful.
- **Fix**: (a) Batch the continue-listening IDs into a single `getPosts({ ids: [1,2,3] })` call if the API supports it. (b) Add loading priority: show skeleton for carousels while the main list loads first, since "All Episodes" is the primary content.
- **Files**: `frontend/src/components/ContinueListening.tsx` (lines 118-128), `frontend/src/components/HomeSections.tsx` (lines 83-97)

## Medium Priority

### 8. TagBadge on cards is not clickable — missed filtering opportunity
- **What**: `TagBadge` in `PostCard` and post detail is rendered without `onClick`. Tags have category colors (blue for AI, green for infra) but clicking does nothing. The `onClick` prop exists but is never wired up from card contexts.
- **Why it matters**: Colored tags with semantic meaning are a strong affordance for "click to filter." Every major content platform (Medium, YouTube, Spotify) makes tags/categories clickable. Users will try to click and be frustrated.
- **Fix**: Pass `onClick={() => router.push('/explore?tag=...')}` to `TagBadge` in `PostCard` and post detail page. Add `cursor-pointer` hover indication when `onClick` is present (already done in TagBadge code, just needs wiring).
- **Files**: `frontend/src/components/PostCard.tsx` (line 128), `frontend/src/app/post/[id]/page.tsx` (line 247)

### 9. Carousel has no visible scroll progress indicator on mobile
- **What**: Carousel hides the scrollbar (`scrollbarWidth: none`) and arrow buttons (`hidden md:flex`). On mobile, there's zero visual indication of how many cards exist or how far the user has scrolled.
- **Why it matters**: Without scroll indicators, mobile users don't know there's more content. The `snap-mandatory` scroll only works if users discover the scroll gesture. A user seeing 1.5 cards might assume that's all there is.
- **Fix**: Add dot indicators (pagination dots) below the carousel on mobile. Or show a subtle gradient fade on the right edge to hint at more content.
- **Files**: `frontend/src/components/Carousel.tsx` (add dot indicators after the scroll container, ~line 102)

### 10. PostCard and PostListItem have no visual differentiation for audio_status
- **What**: Posts without audio (pending/failed) look identical to audio-ready posts except for the action button area. There's no visual badge, opacity change, or border accent to quickly signal "this has a podcast" vs "this doesn't."
- **Why it matters**: On Explore, where all statuses are mixed, users scanning the grid can't quickly distinguish listenable posts from pending ones without reading each card's action area.
- **Fix**: Add a small audio-ready indicator — a headphones icon badge in the card header, or a colored left border (coral for ready, gray for pending). Spotify uses a green "playing" indicator for this purpose.
- **Files**: `frontend/src/components/PostCard.tsx` (line 62), `frontend/src/components/PostListItem.tsx` (line 47)

### 11. Browse page source cards lack visual identity — all look the same
- **What**: Every source card in `/browse` is a plain bordered box with name + count. No logos, icons, color coding, or visual distinction between "Uber Engineering" and "Cloudflare Blog."
- **Why it matters**: Visual recognition is faster than text scanning. Users familiar with Uber's black-and-white or Cloudflare's orange can't leverage existing brand associations. All 14 cards blur together.
- **Fix**: Add a colored accent stripe (top border) using a deterministic color per source key. Or add source favicons/logos if available. Even just a larger first-letter avatar (like Gmail contacts) would help.
- **Files**: `frontend/src/app/browse/page.tsx` (lines 86-99)

### 12. Post detail "Back to Explore" doesn't preserve filter state
- **What**: The back link is a hard `<Link href="/explore">`. If user was on Explore page 5 with "Uber" source filter, clicking into a post and back resets everything.
- **Why it matters**: This breaks the browse flow. Users filtering through 1125 posts lose their position and must re-apply filters. This is a top-3 frustration in content browsing UX.
- **Fix**: Use `router.back()` instead of a hard link, or persist filter state in URL search params and pass them through as a `returnUrl` query param on the post detail link.
- **Files**: `frontend/src/app/post/[id]/page.tsx` (lines 192-199)

## Low Priority

### 13. Duplicated utility functions across 3 files
- **What**: `formatDuration()` is defined identically in `PostCard.tsx`, `PostListItem.tsx`, `CarouselCard.tsx`, and `ContinueListening.tsx`. `formatDate()` exists in both `PostCard.tsx` and post detail. `truncateSummary()` in both `PostCard` and `PostListItem`.
- **Why it matters**: Not a UX issue directly, but inconsistencies will creep in (e.g., PostListItem truncates at 120 chars, PostCard at 150). Maintenance burden increases.
- **Fix**: Extract to `lib/formatters.ts` and import everywhere.
- **Files**: All card components

### 14. Explore page sort options are limited — no "duration" or "quality" sort
- **What**: Only 3 sort options: Newest, Oldest, Title A-Z. For a podcast app, sorting by duration (shortest first for commute listening) or quality score would add value.
- **Why it matters**: The "Quick Listens" carousel on Home addresses duration sorting, but Explore has no equivalent. Users who want short episodes must scroll through all 1125.
- **Fix**: Add "Shortest First" and "Longest First" sort options. The API already has `audio_duration_secs` data.
- **Files**: `frontend/src/app/explore/page.tsx` (lines 15-19)

### 15. Error states use dark-mode-only styling (red-900/30, red-700/50)
- **What**: Error banners across all pages use `bg-red-900/30 border border-red-700/50 text-red-300` — these are hardcoded dark-mode colors, not CSS variables. In light mode, the red-300 text on red-900 bg will have poor contrast.
- **Why it matters**: The rest of the app uses CSS custom properties for theming. Error states breaking this pattern means they'll look wrong in light mode.
- **Fix**: Use theme-aware CSS vars: `bg-[var(--error)]/10 border-[var(--error)] text-[var(--error)]` (the pattern already exists in the post detail error state).
- **Files**: `frontend/src/app/page.tsx` (line 91), `frontend/src/app/explore/page.tsx` (line 281), `frontend/src/app/browse/page.tsx` (line 64)

## Best Practices Researched

- [NN/G Neobrutalism](https://www.nngroup.com/articles/neobrutalism/): Limit to 2-3 bold colors, pair bold headlines with clean body fonts, retain visual hierarchy, ensure interactive states are clear. The PostCard action bar violates the hierarchy principle.
- [LogRocket Filter UX](https://blog.logrocket.com/ux-design/filtering-ux-ui-design-patterns-best-practices/): Applied filters must always be visible, filter chips enable one-click removal, show result counts dynamically, progressive disclosure for large filter sets.
- [NN/G Cards Component](https://www.nngroup.com/articles/cards-component/): Cards should be scannable with clear primary action. One primary CTA per card — secondary actions should be de-emphasized or hidden.
- [UXPin Filter UI 101](https://www.uxpin.com/studio/blog/filter-ui-and-ux/): Sidebar filters work well on desktop but need full-screen drawers on mobile. Always show "active filter" indicators outside the filter panel.
- [Neo Brutalism UI Library](https://neo-brutalism-ui-library.vercel.app/components/card): Reference implementation uses thick borders + solid shadows + generous padding. Cards have single primary action, not action bars.
- [BricxLabs 15 Filter Patterns](https://bricxlabs.com/blogs/universal-search-and-filters-ui): AI-powered filters, horizontal filter chips for applied state, real-time result updates. Accordion filters for mobile.
