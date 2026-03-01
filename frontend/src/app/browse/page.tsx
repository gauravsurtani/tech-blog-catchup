"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSources, getTags } from "@/lib/api";
import type { Source, Tag } from "@/lib/types";

function SourceCardSkeleton() {
  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5 animate-pulse">
      <div className="h-5 w-32 bg-[var(--color-bg-hover)] rounded mb-3" />
      <div className="h-4 w-16 bg-[var(--color-bg-hover)] rounded" />
    </div>
  );
}

function TagCardSkeleton() {
  return (
    <div className="h-10 w-24 bg-[var(--color-bg-hover)] rounded-full animate-pulse" />
  );
}

export default function BrowsePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [sourcesData, tagsData] = await Promise.all([
          getSources(),
          getTags(),
        ]);
        if (cancelled) return;
        setSources(sourcesData.sort((a, b) => b.post_count - a.post_count));
        setTags(tagsData.sort((a, b) => b.post_count - a.post_count));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Browse</h1>
      <p className="text-[var(--color-text-muted)] mb-10">
        Discover posts by engineering team or topic.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg p-4 mb-6">
          <p className="text-sm">Failed to load: {error}</p>
        </div>
      )}

      {/* Browse by Source */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-5">
          By Source
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SourceCardSkeleton key={i} />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">
            No sources available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <Link
                key={source.key}
                href={`/explore?source=${encodeURIComponent(source.key)}`}
                className="group bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors mb-1">
                  {source.name}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {source.post_count}{" "}
                  {source.post_count === 1 ? "post" : "posts"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Browse by Category */}
      <section>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-5">
          By Category
        </h2>
        {loading ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <TagCardSkeleton key={i} />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">
            No categories available yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/explore?tag=${encodeURIComponent(tag.slug)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/50 transition-colors"
              >
                <span>{tag.name}</span>
                <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded-full">
                  {tag.post_count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
