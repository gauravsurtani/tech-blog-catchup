"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Plus,
  Loader2,
  Music,
  ListMusic,
  Filter,
} from "lucide-react";
import { getPlaylist, getSources, getTags } from "@/lib/api";
import type { Post, Source, Tag } from "@/lib/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

function formatDuration(seconds: number | null): string {
  if (!seconds || !isFinite(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlaylistPage() {
  const { play, addToQueue, currentTrack, queue } = useAudioPlayer();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

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
    return queue.some((q) => q.id === post.id);
  };

  const isCurrentlyPlaying = (post: Post) => {
    return currentTrack?.id === post.id;
  };

  const handlePlayAll = () => {
    if (posts.length === 0) return;
    play(posts[0]);
    posts.slice(1).forEach((post) => addToQueue(post));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Playlist</h1>
          <p className="text-gray-400 mt-1">
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
        <Filter size={16} className="text-gray-400" />
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="text-gray-400 animate-spin mb-3" />
          <p className="text-gray-400">Loading playlist...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={fetchPosts}
            className="text-sm text-gray-300 hover:text-white underline"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Music size={48} className="text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg mb-1">No audio tracks found</p>
          <p className="text-gray-500 text-sm">
            {selectedSource || selectedTag
              ? "Try adjusting your filters."
              : "Run the audio generator to create podcast episodes from blog posts."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => {
            const playing = isCurrentlyPlaying(post);
            const queued = isInQueue(post);

            return (
              <div
                key={post.id}
                className={`bg-gray-900 border rounded-xl p-4 transition-all hover:border-gray-600 ${
                  playing
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-gray-800"
                }`}
              >
                {/* Source badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    {post.source_name}
                  </span>
                  {post.audio_duration_secs && (
                    <span className="text-xs text-gray-500">
                      {formatDuration(post.audio_duration_secs)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-gray-100 leading-snug mb-1 line-clamp-2">
                  {post.title}
                </h3>

                {/* Author */}
                {post.author && (
                  <p className="text-xs text-gray-500 mb-2">{post.author}</p>
                )}

                {/* Summary preview */}
                {post.summary && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                    {post.summary}
                  </p>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-[10px] text-gray-500">
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-800">
                  <button
                    onClick={() => play(post)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      playing
                        ? "bg-green-500 text-black"
                        : "bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Play size={12} />
                    {playing ? "Playing" : "Play"}
                  </button>
                  <button
                    onClick={() => {
                      if (!queued) addToQueue(post);
                    }}
                    disabled={queued}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      queued
                        ? "bg-gray-800 text-green-400 cursor-default"
                        : "bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {queued ? (
                      <>
                        <ListMusic size={12} />
                        In Queue
                      </>
                    ) : (
                      <>
                        <Plus size={12} />
                        Queue
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
