"use client";

import Link from "next/link";
import { Play, Clock, User, ExternalLink, Plus, Loader, Mic } from "lucide-react";
import type { Post } from "@/lib/types";
import TagBadge from "./TagBadge";

interface PostCardProps {
  post: Post;
  onPlay?: (post: Post) => void;
  onAddToQueue?: (post: Post) => void;
  onGenerate?: (post: Post) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
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

function truncateSummary(summary: string | null, maxLen: number = 150): string {
  if (!summary) return "";
  if (summary.length <= maxLen) return summary;
  return summary.slice(0, maxLen).trimEnd() + "...";
}

function formatWordCount(count: number | null): string {
  if (!count) return "";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k words`;
  }
  return `${count} words`;
}

export default function PostCard({ post, onPlay, onAddToQueue, onGenerate }: PostCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors">
      {/* Source name */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {post.source_name}
        </span>
        {post.published_at && (
          <span className="text-xs text-gray-500">
            {formatDate(post.published_at)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold leading-tight">
        <div className="flex items-start gap-1.5">
          <Link
            href={`/post/${post.id}`}
            className="text-gray-100 hover:text-white hover:underline transition-colors flex-1"
          >
            {post.title}
          </Link>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 mt-1 text-gray-500 hover:text-gray-300 transition-colors"
            title="Open original article"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </h3>

      {/* Author */}
      {post.author && (
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <User className="w-3.5 h-3.5" />
          <span>{post.author}</span>
        </div>
      )}

      {/* Summary */}
      {post.summary && (
        <p className="text-sm text-gray-400 leading-relaxed">
          {truncateSummary(post.summary)}
        </p>
      )}

      {/* Meta info: word count + audio duration */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {post.word_count && (
          <span>{formatWordCount(post.word_count)}</span>
        )}
        {post.audio_duration_secs && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(post.audio_duration_secs)}
          </span>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagBadge key={tag} name={tag} />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-800">
        {post.audio_status === "ready" && (
          <button
            onClick={() => onPlay?.(post)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Play
          </button>
        )}
        {(post.audio_status === "pending" || post.audio_status === "failed") && onGenerate && (
          <button
            onClick={() => onGenerate(post)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            Generate
          </button>
        )}
        {post.audio_status === "processing" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-900/40 text-yellow-400 text-sm font-medium rounded-lg border border-yellow-700/40">
            <Loader className="w-3.5 h-3.5 animate-spin" />
            Generating...
          </span>
        )}
        <button
          onClick={() => onAddToQueue?.(post)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors ml-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add to queue
        </button>
      </div>
    </div>
  );
}
