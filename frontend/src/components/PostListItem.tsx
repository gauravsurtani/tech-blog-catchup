"use client";

import Link from "next/link";
import { Play, Plus, Loader, Clock, User, Mic, Heart } from "lucide-react";
import type { Post } from "@/lib/types";
import { useFavorites } from "@/hooks/useFavorites";

interface PostListItemProps {
  post: Post;
  onPlay?: (post: Post) => void;
  onAddToQueue?: (post: Post) => void;
  onGenerate?: (post: Post) => void;
  isPlaying?: boolean;
  isQueued?: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function truncateSummary(summary: string | null, maxLen: number = 120): string {
  if (!summary) return "";
  if (summary.length <= maxLen) return summary;
  return summary.slice(0, maxLen).trimEnd() + "...";
}

export default function PostListItem({
  post,
  onPlay,
  onAddToQueue,
  onGenerate,
  isPlaying = false,
  isQueued = false,
}: PostListItemProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(post.id);

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
        isPlaying ? "border-l-2 border-l-green-500 bg-green-500/5" : ""
      }`}
    >
      {/* Play / Status icon */}
      <div className="flex-shrink-0 w-8">
        {post.audio_status === "ready" ? (
          <button
            onClick={() => onPlay?.(post)}
            className="w-7 h-7 flex items-center justify-center bg-green-600 hover:bg-green-500 text-white rounded-full transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" fill="currentColor" />
          </button>
        ) : post.audio_status === "processing" ? (
          <div className="w-7 h-7 flex items-center justify-center">
            <Loader className="w-4 h-4 text-yellow-400 animate-spin" />
          </div>
        ) : onGenerate && (post.audio_status === "pending" || post.audio_status === "failed") ? (
          <button
            onClick={() => onGenerate(post)}
            className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors cursor-pointer"
            title="Generate podcast"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-7 h-7" />
        )}
      </div>

      {/* Title + Summary */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/post/${post.id}`}
            className="text-sm font-medium text-gray-100 hover:text-white hover:underline transition-colors truncate"
          >
            {post.title}
          </Link>
        </div>
        {post.summary && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {truncateSummary(post.summary)}
          </p>
        )}
      </div>

      {/* Source badge */}
      <span className="flex-shrink-0 text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full hidden sm:inline-block">
        {post.source_name}
      </span>

      {/* Author */}
      {post.author && (
        <span className="flex-shrink-0 hidden md:flex items-center gap-1 text-xs text-gray-500">
          <User className="w-3 h-3" />
          <span className="max-w-[100px] truncate">{post.author}</span>
        </span>
      )}

      {/* Duration */}
      {post.audio_duration_secs ? (
        <span className="flex-shrink-0 hidden sm:flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatDuration(post.audio_duration_secs)}
        </span>
      ) : null}

      {/* Favorite button */}
      <button
        onClick={() => toggleFavorite(post.id)}
        className="flex-shrink-0 p-1 hover:bg-gray-800 rounded transition-colors cursor-pointer"
        title={favorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`w-3.5 h-3.5 ${favorited ? "text-red-500 fill-red-500" : "text-gray-500 hover:text-gray-300"}`}
        />
      </button>

      {/* Queue button */}
      <div className="flex-shrink-0">
        {isQueued ? (
          <span className="text-xs text-green-400 px-2 py-1">In Queue</span>
        ) : (
          <button
            onClick={() => onAddToQueue?.(post)}
            className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
