"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Loader2,
  Music,
  Filter,
} from "lucide-react";
import { getPlaylist, getSources, getTags } from "@/lib/api";
import type { Post, Source, Tag } from "@/lib/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import PostListItem from "@/components/PostListItem";

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
