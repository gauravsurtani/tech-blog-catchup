"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Heart,
  ListMusic,
  History,
  Clock,
  Loader2,
  Play,
  Plus,
  Library,
} from "lucide-react";
import { getPost } from "@/lib/api";
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: "var(--color-bg-tertiary)" }}
      >
        <Icon className="w-8 h-8" style={{ color: "var(--color-text-muted)" }} />
      </div>
      <p
        className="text-lg font-medium mb-1"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {title}
      </p>
      <p
        className="text-sm mb-4 text-center max-w-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {description}
      </p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "var(--color-accent-text)",
        }}
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
    if (favorites.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.allSettled(favorites.map((id) => getPost(id))).then((results) => {
      if (cancelled) return;
      const fetched: Post[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") fetched.push(r.value);
      }
      setPosts(fetched);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [favorites]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: "var(--color-text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
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
          className="flex items-center gap-4 p-4 rounded-xl transition-colors"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ backgroundColor: pl.color }}
          >
            {pl.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {pl.name}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {pl.postIds.length} {pl.postIds.length === 1 ? "episode" : "episodes"}
            </p>
            {pl.description && (
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {pl.description}
              </p>
            )}
          </div>
          <Play className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
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
    if (historyEntries.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const ids = historyEntries.map((e) => e.postId);
    Promise.allSettled(ids.map((id) => getPost(id))).then((results) => {
      if (cancelled) return;
      const fetched: Post[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") fetched.push(r.value);
      }
      // Maintain the history order (most recent first)
      const postMap = new Map(fetched.map((p) => [p.id, p]));
      const ordered = ids.map((id) => postMap.get(id)).filter((p): p is Post => !!p);
      setPosts(ordered);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [historyEntries]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: "var(--color-text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Loading history...
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
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
            className="flex items-center gap-4 p-3 rounded-lg transition-colors group"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--color-bg-secondary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            {/* Play button */}
            <button
              onClick={() => post.audio_status === "ready" && play(post)}
              disabled={post.audio_status !== "ready"}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
              style={{ backgroundColor: "var(--color-bg-tertiary)" }}
            >
              <Play className="w-4 h-4" style={{ color: "var(--color-text-primary)" }} />
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/post/${post.id}`}
                className="text-sm font-medium truncate block hover:underline"
                style={{ color: "var(--color-text-primary)" }}
              >
                {post.title}
              </Link>
              <div className="flex items-center gap-3 mt-0.5">
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {post.source_name}
                </span>
                {entry && (
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(entry.updatedAt)}
                  </span>
                )}
              </div>
              {/* Progress bar */}
              {progressPct > 0 && progressPct < 100 && (
                <div
                  className="mt-1.5 h-1 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: "var(--color-bg-tertiary)",
                    maxWidth: "12rem",
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      width: `${progressPct}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Duration / progress label */}
            <div className="text-right shrink-0">
              {entry && entry.duration > 0 && (
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {formatDuration(entry.position)} / {formatDuration(entry.duration)}
                </span>
              )}
              {progressPct >= 100 && (
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-accent)" }}
                >
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
        <Library className="w-7 h-7" style={{ color: "var(--color-accent)" }} />
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
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
