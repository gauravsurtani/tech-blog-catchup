"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, SearchX, X, Loader2, Clock, Trash2 } from "lucide-react";
import { getPosts } from "@/lib/api";
import type { Post } from "@/lib/types";

const RECENT_SEARCHES_KEY = "tbc-recent-searches";
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = getRecentSearches();
  const filtered = existing.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function removeRecentSearch(query: string): string[] {
  const existing = getRecentSearches();
  const updated = existing.filter((s) => s !== query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

function clearAllRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[var(--color-accent)]/25 text-inherit rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setHasSearched(false);
      setRecentSearches(getRecentSearches());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await getPosts({ search: query.trim(), limit: 8 });
        setResults(data.posts);
        setSelectedIndex(0);
        setHasSearched(true);
      } catch {
        setResults([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateToResult = useCallback(
    (post: Post) => {
      saveRecentSearch(query);
      onClose();
      router.push(`/post/${post.id}`);
    },
    [onClose, router, query],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const showingRecent = !query.trim() && recentSearches.length > 0;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const maxIndex = showingRecent ? recentSearches.length - 1 : results.length - 1;
        setSelectedIndex((i) => Math.min(i + 1, maxIndex));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (showingRecent && recentSearches[selectedIndex]) {
          setQuery(recentSearches[selectedIndex]);
        } else if (results[selectedIndex]) {
          navigateToResult(results[selectedIndex]);
        }
      }
    },
    [results, selectedIndex, navigateToResult, query, recentSearches],
  );

  const handleRemoveRecent = useCallback((searchTerm: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentSearch(searchTerm);
    setRecentSearches(updated);
    setSelectedIndex(0);
  }, []);

  const handleClearAll = useCallback(() => {
    clearAllRecentSearches();
    setRecentSearches([]);
    setSelectedIndex(0);
  }, []);

  const handleRecentClick = useCallback((searchTerm: string) => {
    setQuery(searchTerm);
  }, []);

  if (!open) return null;

  const showRecentSearches = !query.trim() && recentSearches.length > 0;
  const showNoResults = query.trim() && hasSearched && !loading && results.length === 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border)]">
          <Search size={18} className="shrink-0 text-[var(--color-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts..."
            className="flex-1 py-3.5 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none text-sm"
          />
          {loading && (
            <Loader2 size={16} className="shrink-0 text-[var(--color-text-muted)] animate-spin" />
          )}
          <button
            onClick={onClose}
            className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {showRecentSearches && (
          <div className="py-2">
            <div className="flex items-center justify-between px-4 py-1.5">
              <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Recent Searches
              </span>
              <button
                onClick={handleClearAll}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
              >
                Clear all
              </button>
            </div>
            <ul>
              {recentSearches.map((term, i) => (
                <li key={term}>
                  <button
                    onClick={() => handleRecentClick(term)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${
                      i === selectedIndex
                        ? "bg-[var(--color-bg-hover)]"
                        : "hover:bg-[var(--color-bg-hover)]"
                    }`}
                  >
                    <Clock size={14} className="shrink-0 text-[var(--color-text-muted)]" />
                    <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">
                      {term}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemoveRecent(term, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          const updated = removeRecentSearch(term);
                          setRecentSearches(updated);
                          setSelectedIndex(0);
                        }
                      }}
                      className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors p-0.5 rounded"
                    >
                      <Trash2 size={12} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((post, i) => (
              <li key={post.id}>
                <button
                  onClick={() => navigateToResult(post)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${
                    i === selectedIndex
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                >
                  <span className="text-sm font-medium line-clamp-1">
                    <HighlightedText text={post.title} query={query} />
                  </span>
                  <span
                    className={`text-xs ${
                      i === selectedIndex
                        ? "text-[var(--color-accent-text)]/70"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {post.source_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {showNoResults && (
          <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
            <SearchX size={32} className="text-[var(--color-text-muted)]" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              No results found for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Try different keywords or check spelling
            </p>
          </div>
        )}

        <div className="px-4 py-2 border-t border-[var(--color-border)] flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span><kbd className="px-1.5 py-0.5 bg-[var(--color-bg-hover)] rounded text-[10px] font-mono">Esc</kbd> to close</span>
          <span><kbd className="px-1.5 py-0.5 bg-[var(--color-bg-hover)] rounded text-[10px] font-mono">&uarr;&darr;</kbd> to navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-[var(--color-bg-hover)] rounded text-[10px] font-mono">Enter</kbd> to open</span>
        </div>
      </div>
    </div>
  );
}
