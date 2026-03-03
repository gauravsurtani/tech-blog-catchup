"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Heart,
  ListMusic,
  History,
  Clock,
  Loader2,
  Play,
  Library,
} from "lucide-react";
import { getPosts } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";
import type { Post } from "@/lib/types";
import { useFavorites } from "@/hooks/useFavorites";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import LibraryTabs, { type LibraryTab } from "@/components/LibraryTabs";
import PostCard from "@/components/PostCard";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const PLAYBACK_POSITIONS_KEY = "tbc-playback-positions";

interface StoredPosition {
  position: number;
  duration: number;
  updatedAt: string;
}

function getPlaybackHistory(): { postId: number; updatedAt: string; position: number; duration: number }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLAYBACK_POSITIONS_KEY);
    if (!raw) return [];
    const positions: Record<string, StoredPosition> = JSON.parse(raw);
    return Object.entries(positions)
      .map(([id, entry]) => ({
        postId: Number(id),
        updatedAt: entry.updatedAt,
        position: entry.position,
        duration: entry.duration,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: typeof Heart;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-[var(--tag-bg)] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[var(--text-3)]" />
      </div>
      <p className="text-lg font-medium mb-1 text-[var(--text-2)]">
        {title}
      </p>
      <p className="text-sm mb-4 text-center max-w-xs text-[var(--text-3)]">
        {description}
      </p>
      <Link
        href={actionHref}
        className="nb-hover inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-colors"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function FavoritesSection() {
  const { favorites } = useFavorites();
  const { play, addToQueue } = useAudioPlayer();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favorites.length === 0) return;

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });

    getPosts({ ids: favorites, limit: favorites.length }).then(({ posts: fetched }) => {
      if (cancelled) return;
      setPosts(fetched);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [favorites]);

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No favorites yet"
        description="Heart posts you love and they will appear here for quick access."
        actionLabel="Browse Posts"
        actionHref="/explore"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-[var(--text-3)]" />
        <p className="text-sm text-[var(--text-3)]">
          Loading favorites...
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No favorites yet"
        description="Heart posts you love and they will appear here for quick access."
        actionLabel="Browse Posts"
        actionHref="/explore"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPlay={() => play(post)}
          onAddToQueue={() => addToQueue(post)}
        />
      ))}
    </div>
  );
}

function PlaylistsSection() {
  const { playlists } = usePlaylists();

  if (playlists.length === 0) {
    return (
      <EmptyState
        icon={ListMusic}
        title="No playlists yet"
        description="Create playlists to organize episodes by topic, mood, or project."
        actionLabel="Go to Playlist"
        actionHref="/playlist"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-6">
      {playlists.map((pl) => (
        <Link
          key={pl.id}
          href={`/playlist/${pl.id}`}
          className="flex items-center gap-4 p-4 rounded-[var(--radius-xl)] bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] shadow-[var(--shadow-sm)] transition-colors"
        >
          <div
            className="w-12 h-12 rounded-[var(--radius)] flex items-center justify-center text-[var(--primary-text)] text-lg font-bold shrink-0"
            style={{ backgroundColor: pl.color }}
          >
            {pl.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate text-[var(--text-1)]">
              {pl.name}
            </p>
            <p className="text-xs text-[var(--text-3)]">
              {pl.postIds.length} {pl.postIds.length === 1 ? "episode" : "episodes"}
            </p>
            {pl.description && (
              <p className="text-xs truncate mt-0.5 text-[var(--text-3)]">
                {pl.description}
              </p>
            )}
          </div>
          <Play className="w-4 h-4 shrink-0 text-[var(--text-3)]" />
        </Link>
      ))}
    </div>
  );
}

function HistorySection() {
  const { play } = useAudioPlayer();
  const historyEntries = useMemo(() => getPlaybackHistory(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (historyEntries.length === 0) return;

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });

    const ids = historyEntries.map((e) => e.postId);
    getPosts({ ids, limit: ids.length }).then(({ posts: fetched }) => {
      if (cancelled) return;
      // Maintain the history order (most recent first)
      const postMap = new Map(fetched.map((p) => [p.id, p]));
      const ordered = ids.map((id) => postMap.get(id)).filter((p): p is Post => !!p);
      setPosts(ordered);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [historyEntries]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-[var(--text-3)]" />
        <p className="text-sm text-[var(--text-3)]">
          Loading history...
        </p>
      </div>
    );
  }

  if (historyEntries.length === 0 || posts.length === 0) {
    if (historyEntries.length === 0) {
      return (
        <EmptyState
          icon={History}
          title="No listening history"
          description="Posts you listen to will appear here so you can pick up where you left off."
          actionLabel="Start Listening"
          actionHref="/"
        />
      );
    }
  }

  return (
    <div className="flex flex-col gap-1 pt-6">
      {posts.map((post) => {
        const entry = historyEntries.find((e) => e.postId === post.id);
        const progressPct = entry && entry.duration > 0
          ? Math.round((entry.position / entry.duration) * 100)
          : 0;
        return (
          <div
            key={post.id}
            className="flex items-center gap-4 p-3 rounded-[var(--radius)] transition-colors group hover:bg-[var(--bg-elevated)]"
          >
            {/* Play button */}
            <button
              onClick={() => post.audio_status === "ready" && play(post)}
              disabled={post.audio_status !== "ready"}
              className="w-10 h-10 rounded-full bg-[var(--tag-bg)] flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              <Play className="w-4 h-4 text-[var(--text-1)]" />
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/post/${post.id}`}
                className="text-sm font-medium truncate block hover:underline text-[var(--text-1)]"
              >
                {post.title}
              </Link>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-[var(--text-3)]">
                  {post.source_name}
                </span>
                {entry && (
                  <span className="text-xs flex items-center gap-1 text-[var(--text-3)]">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(entry.updatedAt)}
                  </span>
                )}
              </div>
              {/* Progress bar */}
              {progressPct > 0 && progressPct < 100 && (
                <div
                  className="mt-1.5 h-1 rounded-full overflow-hidden bg-[var(--tag-bg)]"
                  style={{ maxWidth: "12rem" }}
                >
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>

            {/* Duration / progress label */}
            <div className="text-right shrink-0">
              {entry && entry.duration > 0 && (
                <span className="text-xs text-[var(--text-3)]">
                  {formatDuration(entry.position)} / {formatDuration(entry.duration)}
                </span>
              )}
              {progressPct >= 100 && (
                <span className="text-xs font-medium text-[var(--primary)]">
                  Completed
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("favorites");
  const { favorites } = useFavorites();
  const { playlists } = usePlaylists();
  const historyCount = useMemo(() => getPlaybackHistory().length, []);

  const counts = {
    favorites: favorites.length,
    playlists: playlists.length,
    history: historyCount,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Library className="w-7 h-7 text-[var(--primary)]" />
        <h1 className="text-2xl font-extrabold text-[var(--text-1)]">
          Your Library
        </h1>
      </div>

      {/* Tabs */}
      <LibraryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {/* Tab Content */}
      {activeTab === "favorites" && <FavoritesSection />}
      {activeTab === "playlists" && <PlaylistsSection />}
      {activeTab === "history" && <HistorySection />}
    </div>
  );
}
