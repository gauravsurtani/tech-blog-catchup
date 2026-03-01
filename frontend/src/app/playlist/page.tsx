"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Loader2,
  Music,
  Filter,
  Plus,
  ListMusic,
} from "lucide-react";
import { getPlaylist, getSources, getTags } from "@/lib/api";
import type { Post, Source, Tag } from "@/lib/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { usePlaylists } from "@/hooks/usePlaylists";
import PostListItem from "@/components/PostListItem";

export default function PlaylistPage() {
  const { play, addToQueue, currentTrack, queue } = useAudioPlayer();
  const { playlists, createPlaylist } = usePlaylists();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  // Fetch filter options on mount
  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(() => {});
    getTags()
      .then(setTags)
      .catch(() => {});
  }, []);

  // Fetch posts when filters change
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlaylist({
        audio_status: "ready",
        source: selectedSource || undefined,
        tag: selectedTag || undefined,
        limit: 50,
      });
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlist");
    } finally {
      setLoading(false);
    }
  }, [selectedSource, selectedTag]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const isInQueue = (post: Post) => {
    return queue.some((q: Post) => q.id === post.id);
  };

  const isCurrentlyPlaying = (post: Post) => {
    return currentTrack?.id === post.id;
  };

  const handlePlayAll = () => {
    if (posts.length === 0) return;
    play(posts[0]);
    posts.slice(1).forEach((post: Post) => addToQueue(post));
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createPlaylist(trimmed);
    setNewName("");
    setShowCreate(false);
  };

  return (
    <div>
      {/* Named Playlists Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Your Playlists</h2>
          {showCreate ? (
            <form
              onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                handleCreate();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                placeholder="Playlist name"
                autoFocus
                className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-48"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                }}
                className="px-3 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] text-sm rounded-lg transition-colors"
            >
              <Plus size={14} />
              New Playlist
            </button>
          )}
        </div>

        {playlists.length === 0 ? (
          <div className="flex flex-col items-center py-8 border border-dashed border-[var(--color-border)] rounded-xl">
            <ListMusic size={32} className="text-[var(--color-text-muted)] mb-2 opacity-50" />
            <p className="text-sm text-[var(--color-text-muted)]">
              No playlists yet. Create one to organize your favorite episodes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playlists.map((pl) => (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0"
                  style={{ backgroundColor: pl.color }}
                >
                  {pl.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {pl.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {pl.postIds.length} {pl.postIds.length === 1 ? "post" : "posts"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Audio Queue Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Audio Queue</h2>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">
            Browse and listen to posts with audio ready
          </p>
        </div>
        {posts.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-full transition-colors shrink-0"
          >
            <Play size={18} />
            Play All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter size={16} className="text-[var(--color-text-muted)]" />
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Sources</option>
          {sources.map((source) => (
            <option key={source.key} value={source.key}>
              {source.name} ({source.post_count})
            </option>
          ))}
        </select>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.slug} value={tag.slug}>
              {tag.name} ({tag.post_count})
            </option>
          ))}
        </select>
        {(selectedSource || selectedTag) && (
          <button
            onClick={() => {
              setSelectedSource("");
              setSelectedTag("");
            }}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors px-2 py-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="text-[var(--color-text-muted)] animate-spin mb-3" />
          <p className="text-[var(--color-text-muted)]">Loading playlist...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={fetchPosts}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Music size={48} className="text-[var(--color-text-muted)] mb-4 opacity-50" />
          <p className="text-[var(--color-text-secondary)] text-lg mb-1">No audio tracks found</p>
          <p className="text-[var(--color-text-muted)] text-sm">
            {selectedSource || selectedTag
              ? "Try adjusting your filters."
              : "Run the audio generator to create podcast episodes from blog posts."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {posts.map((post) => (
            <PostListItem
              key={post.id}
              post={post}
              onPlay={() => play(post)}
              onAddToQueue={() => { if (!isInQueue(post)) addToQueue(post); }}
              isPlaying={isCurrentlyPlaying(post)}
              isQueued={isInQueue(post)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
