"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Clock, User, ExternalLink, Plus, Loader, Mic, Heart } from "lucide-react";
import type { Post } from "@/lib/types";
import { useFavorites } from "@/hooks/useFavorites";
import { formatDate, formatDuration, formatWordCount } from "@/lib/formatters";
import TagBadge from "./TagBadge";
import ShareButton from "./ShareButton";

interface PostCardProps {
  post: Post;
  onPlay?: (post: Post) => void;
  onAddToQueue?: (post: Post) => void;
  onGenerate?: (post: Post) => void;
}

export default function PostCard({ post, onPlay, onAddToQueue, onGenerate }: PostCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(post.id);

  return (
    <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 flex flex-col gap-3 shadow-[var(--shadow-lg)] nb-hover transition-all">
      {/* Source name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wide bg-[var(--tag-bg)] px-2 py-0.5 rounded-[var(--radius-full)]">
            {post.source_name}
          </span>
          {post.audio_status === "ready" && (
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)]" title="Audio ready" />
          )}
          {(post.audio_status === "pending" || post.audio_status === "failed") && (
            <span className="w-2 h-2 rounded-full bg-[var(--orange)]" title="Audio pending" />
          )}
        </div>
        {post.published_at && (
          <span className="text-xs text-[var(--text-3)]">
            {formatDate(post.published_at)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold leading-tight">
        <div className="flex items-start gap-1.5">
          <Link
            href={`/post/${post.id}`}
            className="text-[var(--text-1)] hover:text-[var(--primary)] hover:underline transition-colors flex-1"
          >
            {post.title}
          </Link>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 mt-1 text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
            title="Open original article"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </h3>

      {/* Author */}
      {post.author && (
        <div className="flex items-center gap-1.5 text-sm text-[var(--text-2)]">
          <User className="w-3.5 h-3.5" />
          <span>{post.author}</span>
        </div>
      )}

      {/* Summary */}
      {post.summary && (
        <p className="text-sm text-[var(--text-2)] leading-relaxed line-clamp-3">
          {post.summary}
        </p>
      )}

      {/* Meta info: word count + audio duration */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-3)]">
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
            <TagBadge key={tag} name={tag} onClick={() => router.push(`/explore?tag=${encodeURIComponent(tag)}`)} />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[var(--split)]">
        {post.audio_status === "ready" && (
          <button
            onClick={() => onPlay?.(post)}
            className="inline-flex items-center justify-center w-[42px] h-[42px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] rounded-full border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] nb-hover transition-all cursor-pointer"
          >
            <Play className="w-4 h-4" fill="currentColor" />
          </button>
        )}
        {(post.audio_status === "pending" || post.audio_status === "failed") && onGenerate && (
          <button
            onClick={() => onGenerate(post)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] text-sm font-bold rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            Generate
          </button>
        )}
        {post.audio_status === "processing" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--orange-bg)] text-[var(--orange)] text-sm font-bold rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)]">
            <Loader className="w-3.5 h-3.5 animate-spin" />
            Generating...
          </span>
        )}
        <ShareButton postId={post.id} title={post.title} className="ml-auto" />
        <button
          onClick={() => onAddToQueue?.(post)}
          title="Add to queue"
          className="inline-flex items-center justify-center w-[34px] h-[34px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleFavorite(post.id)}
          className="p-1.5 hover:bg-[var(--bg-hover)] rounded-[var(--radius)] transition-colors cursor-pointer"
          title={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`w-4 h-4 ${favorited ? "text-[var(--error)] fill-[var(--error)]" : "text-[var(--text-3)] hover:text-[var(--primary)]"}`}
          />
        </button>
      </div>
    </div>
  );
}
