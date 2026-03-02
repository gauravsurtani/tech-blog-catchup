"use client";

import Link from "next/link";
import { Play, Plus, Loader, Clock, User, Mic, Heart } from "lucide-react";
import type { Post } from "@/lib/types";
import { useFavorites } from "@/hooks/useFavorites";
import ShareButton from "./ShareButton";

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
      className={`flex items-center gap-3 px-3 py-2.5 border-b-[1.5px] border-[var(--split)] hover:bg-[var(--bg-hover)] transition-colors ${
        isPlaying ? "border-l-4 border-l-[var(--primary)] bg-[var(--primary)]/5" : ""
      }`}
    >
      {/* Play / Status icon */}
      <div className="flex-shrink-0 w-10">
        {post.audio_status === "ready" ? (
          <button
            onClick={() => onPlay?.(post)}
            className="w-[42px] h-[42px] flex items-center justify-center bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] rounded-full border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] nb-hover transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" fill="currentColor" />
          </button>
        ) : post.audio_status === "processing" ? (
          <div className="w-[42px] h-[42px] flex items-center justify-center">
            <Loader className="w-4 h-4 text-[var(--orange)] animate-spin" />
          </div>
        ) : onGenerate && (post.audio_status === "pending" || post.audio_status === "failed") ? (
          <button
            onClick={() => onGenerate(post)}
            className="w-[42px] h-[42px] flex items-center justify-center bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] rounded-full border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] nb-hover transition-all cursor-pointer"
            title="Generate podcast"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-[42px] h-[42px]" />
        )}
      </div>

      {/* Title + Summary */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/post/${post.id}`}
            className="text-sm font-bold text-[var(--text-1)] hover:text-[var(--primary)] hover:underline transition-colors truncate"
          >
            {post.title}
          </Link>
        </div>
        {post.summary && (
          <p className="text-xs text-[var(--text-3)] truncate mt-0.5">
            {truncateSummary(post.summary)}
          </p>
        )}
      </div>

      {/* Source badge */}
      <span className="flex-shrink-0 text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-[var(--radius-full)] border-[1.5px] border-[var(--border-color)] hidden sm:inline-block">
        {post.source_name}
      </span>

      {/* Author */}
      {post.author && (
        <span className="flex-shrink-0 hidden md:flex items-center gap-1 text-xs text-[var(--text-3)]">
          <User className="w-3 h-3" />
          <span className="max-w-[100px] truncate">{post.author}</span>
        </span>
      )}

      {/* Duration */}
      {post.audio_duration_secs ? (
        <span className="flex-shrink-0 hidden sm:flex items-center gap-1 text-xs text-[var(--text-3)]">
          <Clock className="w-3 h-3" />
          {formatDuration(post.audio_duration_secs)}
        </span>
      ) : null}

      {/* Share button */}
      <ShareButton postId={post.id} title={post.title} className="flex-shrink-0" />

      {/* Favorite button */}
      <button
        onClick={() => toggleFavorite(post.id)}
        className="flex-shrink-0 p-1 hover:bg-[var(--bg-hover)] rounded-[var(--radius)] transition-colors cursor-pointer"
        title={favorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`w-3.5 h-3.5 ${favorited ? "text-[var(--error)] fill-[var(--error)]" : "text-[var(--text-3)] hover:text-[var(--primary)]"}`}
        />
      </button>

      {/* Queue button */}
      <div className="flex-shrink-0">
        {isQueued ? (
          <span className="text-xs font-bold text-[var(--primary)] px-2 py-1">In Queue</span>
        ) : (
          <button
            onClick={() => onAddToQueue?.(post)}
            className="w-8 h-8 flex items-center justify-center bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
