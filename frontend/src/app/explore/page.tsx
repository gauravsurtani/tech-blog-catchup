"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { getTags, getSources, triggerGenerate } from "@/lib/api";
import PostCard from "@/components/PostCard";
import SourceFilter from "@/components/SourceFilter";
import TagFilter from "@/components/TagFilter";
import type { Post, Tag, Source } from "@/lib/types";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title", label: "Title A-Z" },
  { value: "shortest", label: "Shortest First" },
  { value: "longest", label: "Longest First" },
  { value: "quality", label: "Highest Quality" },
];

function PostCardSkeleton() {
  return (
    <div className="bg-[var(--bg)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-[var(--bg-elevated)] rounded" />
        <div className="h-3 w-16 bg-[var(--bg-elevated)] rounded" />
      </div>
      <div className="h-5 w-full bg-[var(--bg-elevated)] rounded" />
      <div className="h-5 w-3/4 bg-[var(--bg-elevated)] rounded" />
      <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-[var(--bg-elevated)] rounded" />
        <div className="h-3 w-5/6 bg-[var(--bg-elevated)] rounded" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-14 bg-[var(--bg-elevated)] rounded-full" />
        <div className="h-5 w-18 bg-[var(--bg-elevated)] rounded-full" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
        <div className="h-8 w-16 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="h-8 w-28 bg-[var(--bg-elevated)] rounded-lg ml-auto" />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [offset, setOffset] = useState(0);

  // Sidebar / mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tags and sources data
  const [tags, setTags] = useState<Tag[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load tags and sources
  useEffect(() => {
    async function loadFilters() {
      setFiltersLoading(true);
      try {
        const [tagsData, sourcesData] = await Promise.all([
          getTags(),
          getSources(),
        ]);
        setTags(tagsData);
        setSources(sourcesData);
      } catch (err) {
        console.error("Failed to load filters:", err);
      } finally {
        setFiltersLoading(false);
      }
    }
    loadFilters();
  }, []);

  // Apply onboarding preferences on first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applied = sessionStorage.getItem("tbc-prefs-applied");
    if (applied) return;

    // Only apply if no URL params are set
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString()) return;

    try {
      const raw = localStorage.getItem("tbc-user-preferences");
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (prefs.sources && Array.isArray(prefs.sources) && prefs.sources.length > 0) {
        setSelectedSources(prefs.sources);
      }
      if (prefs.tags && Array.isArray(prefs.tags) && prefs.tags.length > 0) {
        setSelectedTags(prefs.tags);
      }
    } catch {
      // ignore
    } finally {
      sessionStorage.setItem("tbc-prefs-applied", "true");
    }
  }, []);

  // Build API params
  const params = useMemo(() => {
    const p: Record<string, string | number | undefined> = {
      limit: PAGE_SIZE,
      offset,
    };
    // Map sort UI values to API sort params
    const sortMap: Record<string, string> = {
      newest: "-published_at",
      oldest: "published_at",
      title: "title",
      shortest: "audio_duration_secs",
      longest: "-audio_duration_secs",
      quality: "-quality_score",
    };
    p.sort = sortMap[sort] || "-published_at";
    if (debouncedSearch) p.search = debouncedSearch;
    if (selectedSources.length === 1) p.source = selectedSources[0];
    else if (selectedSources.length > 1) p.source = selectedSources.join(",");
    if (selectedTags.length === 1) p.tag = selectedTags[0];
    else if (selectedTags.length > 1) p.tag = selectedTags.join(",");
    return p;
  }, [sort, offset, debouncedSearch, selectedSources, selectedTags]);

  const { posts, total, loading, error } = usePosts(params);

  // Reset offset when filters change
  const handleSourceChange = useCallback((selected: string[]) => {
    setSelectedSources(selected);
    setOffset(0);
  }, []);

  const handleTagChange = useCallback((selected: string[]) => {
    setSelectedTags(selected);
    setOffset(0);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSort(value);
    setOffset(0);
  }, []);

  const { play, addToQueue } = useAudioPlayer();

  const handlePlay = useCallback((post: Post) => {
    play(post);
  }, [play]);

  const handleAddToQueue = useCallback((post: Post) => {
    addToQueue(post);
  }, [addToQueue]);

  const handleGenerate = useCallback(async (post: Post) => {
    try {
      await triggerGenerate(post.id);
    } catch (err) {
      console.error("Generate failed:", err);
    }
  }, []);

  // Pagination
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  function goToPage(page: number) {
    setOffset((page - 1) * PAGE_SIZE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeFilterCount =
    selectedSources.length + selectedTags.length + (debouncedSearch ? 1 : 0);

  return (
    <div className="flex gap-6 min-w-0">
      {/* Mobile filter overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-[var(--bg)] border-r border-[var(--border-color)] z-50
          transform transition-transform duration-200 ease-in-out overflow-y-auto
          lg:static lg:transform-none lg:z-auto lg:h-auto lg:border-r-0 lg:w-64 lg:max-w-none lg:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-4 lg:p-0 lg:sticky lg:top-24 space-y-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="text-lg font-semibold text-[var(--text-1)]">Filters</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-[var(--text-3)] hover:text-[var(--text-1)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {filtersLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-20 bg-[var(--bg-elevated)] rounded" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-full bg-[var(--bg-elevated)] rounded" />
              ))}
              <div className="h-4 w-16 bg-[var(--bg-elevated)] rounded mt-6" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-7 w-16 bg-[var(--bg-elevated)] rounded-full" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <SourceFilter
                sources={sources}
                selected={selectedSources}
                onChange={handleSourceChange}
              />
              <div className="border-t border-[var(--border-color)]" />
              <TagFilter
                tags={tags}
                selected={selectedTags}
                onChange={handleTagChange}
              />
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar: search + sort + mobile filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] text-sm font-medium rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[var(--primary)] text-[var(--primary-text)] text-xs px-1.5 py-0.5 rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] text-sm text-[var(--text-1)] placeholder-[var(--text-3)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-1)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2.5 bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] text-sm text-[var(--text-1)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filter chips */}
        {(selectedSources.length > 0 || selectedTags.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {selectedSources.map((sourceKey) => {
              const source = sources.find((s) => s.key === sourceKey);
              return (
                <span
                  key={`source-${sourceKey}`}
                  className="inline-flex items-center gap-1.5 bg-[var(--primary-bg)] text-[var(--text-1)] border border-[var(--border-color)] rounded-[var(--radius-full)] px-3 py-1 text-xs font-bold"
                >
                  {source?.name ?? sourceKey}
                  <button
                    onClick={() =>
                      handleSourceChange(
                        selectedSources.filter((s) => s !== sourceKey)
                      )
                    }
                    className="ml-0.5 hover:text-[var(--error)] transition-colors cursor-pointer"
                    aria-label={`Remove ${source?.name ?? sourceKey} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {selectedTags.map((tagSlug) => {
              const tag = tags.find((t) => t.slug === tagSlug);
              return (
                <span
                  key={`tag-${tagSlug}`}
                  className="inline-flex items-center gap-1.5 bg-[var(--primary-bg)] text-[var(--text-1)] border border-[var(--border-color)] rounded-[var(--radius-full)] px-3 py-1 text-xs font-bold"
                >
                  {tag?.name ?? tagSlug}
                  <button
                    onClick={() =>
                      handleTagChange(
                        selectedTags.filter((t) => t !== tagSlug)
                      )
                    }
                    className="ml-0.5 hover:text-[var(--error)] transition-colors cursor-pointer"
                    aria-label={`Remove ${tag?.name ?? tagSlug} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <button
              onClick={() => {
                handleSourceChange([]);
                handleTagChange([]);
              }}
              className="text-xs font-medium text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors cursor-pointer underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results info */}
        {!loading && total > 0 && (
          <p className="text-sm text-[var(--text-3)] mb-4">
            Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of{" "}
            {total} posts
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-[var(--error-bg)] border border-[var(--error)] text-[var(--error)] rounded-lg p-4 mb-6">
            <p className="text-sm">Failed to load posts: {error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-[var(--text-2)] text-lg mb-2">No posts found</p>
            <p className="text-[var(--text-3)] text-sm">
              {debouncedSearch || selectedSources.length > 0 || selectedTags.length > 0
                ? "Try adjusting your filters or search terms."
                : "No posts available yet. Run the crawler to get started."}
            </p>
          </div>
        )}

        {/* Post grid */}
        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onPlay={handlePlay} onAddToQueue={handleAddToQueue} onGenerate={handleGenerate} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="nb-hover inline-flex items-center gap-1 px-3 py-2 bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] text-[var(--text-2)] text-sm rounded-[var(--radius)] shadow-[var(--shadow-sm)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {generatePageNumbers(currentPage, totalPages).map((page, i) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 py-2 text-sm text-[var(--text-3)]"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={`px-3 py-2 text-sm rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-colors cursor-pointer ${
                      page === currentPage
                        ? "bg-[var(--primary)] text-[var(--primary-text)] font-bold"
                        : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            {/* Jump to page */}
            {totalPages > 7 && (
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="#"
                  className="w-14 px-2 py-2 text-sm text-center bg-[var(--bg)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] text-[var(--text-1)] placeholder-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = parseInt((e.target as HTMLInputElement).value, 10);
                      if (val >= 1 && val <= totalPages) {
                        goToPage(val);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </div>
            )}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="nb-hover inline-flex items-center gap-1 px-3 py-2 bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] text-[var(--text-2)] text-sm rounded-[var(--radius)] shadow-[var(--shadow-sm)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate an array of page numbers with ellipsis for pagination display.
 * Example: [1, '...', 4, 5, 6, '...', 10]
 */
function generatePageNumbers(
  current: number,
  total: number
): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  // Show pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}
