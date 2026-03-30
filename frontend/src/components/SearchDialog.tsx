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
            className="bg-[var(--primary)] text-[var(--primary-text)] px-0.5"
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setHasSearched(false);
      setRecentSearches(getRecentSearches());
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  // Focus trap: cycle Tab through dialog elements only
  useEffect(() => {
    if (!open) return;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-[15vh]"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg mx-4 bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-[var(--border-color)]">
          <Search size={18} className="shrink-0 text-[var(--text-3)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts..."
            className="flex-1 py-3.5 bg-transparent text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none text-base border-none shadow-none"
          />
          {loading && (
            <Loader2 size={16} className="shrink-0 text-[var(--text-3)] animate-spin" />
          )}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {showRecentSearches && (
          <div className="py-2">
            <div className="flex items-center justify-between px-4 py-1.5">
              <span className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wider">
                Recent Searches
              </span>
              <button
                onClick={handleClearAll}
                className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
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
                        ? "bg-[var(--bg-hover)]"
                        : "hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <Clock size={14} className="shrink-0 text-[var(--text-3)]" />
                    <span className="flex-1 text-sm text-[var(--text-1)] truncate">
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
                      className="shrink-0 text-[var(--text-3)] hover:text-[var(--error)] transition-colors p-0.5 rounded-[var(--radius)]"
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
              <li key={post.id} className="border-b-[1px] border-[var(--split)] last:border-b-0">
                <button
                  onClick={() => navigateToResult(post)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${
                    i === selectedIndex
                      ? "bg-[var(--primary)] text-[var(--primary-text)]"
                      : "text-[var(--text-1)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <span className="text-sm font-medium line-clamp-1">
                    <HighlightedText text={post.title} query={query} />
                  </span>
                  <span
                    className={`text-xs ${
                      i === selectedIndex
                        ? "text-[var(--primary-text)]/70"
                        : "text-[var(--text-3)]"
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
            <SearchX size={32} className="text-[var(--text-3)]" />
            <p className="text-sm font-medium text-[var(--text-1)]">
              No results found for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-[var(--text-3)]">
              Try different keywords or check spelling
            </p>
          </div>
        )}

        <div className="px-4 py-2 border-t border-[var(--border-color)] flex items-center gap-4 text-xs text-[var(--text-3)]">
          <span><kbd className="border-[1.5px] border-[var(--border-color)] rounded-[6px] bg-[var(--tag-bg)] text-[var(--text-3)] text-xs px-1.5 py-0.5 font-mono">Esc</kbd> to close</span>
          <span><kbd className="border-[1.5px] border-[var(--border-color)] rounded-[6px] bg-[var(--tag-bg)] text-[var(--text-3)] text-xs px-1.5 py-0.5 font-mono">&uarr;&darr;</kbd> to navigate</span>
          <span><kbd className="border-[1.5px] border-[var(--border-color)] rounded-[6px] bg-[var(--tag-bg)] text-[var(--text-3)] text-xs px-1.5 py-0.5 font-mono">Enter</kbd> to open</span>
        </div>
      </div>
    </div>
  );
}
