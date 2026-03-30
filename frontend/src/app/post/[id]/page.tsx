"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Plus,
  ArrowLeft,
  ExternalLink,
  Clock,
  User,
  Loader,
  Mic,
  Heart,
} from "lucide-react";
import { getPost, triggerGenerate, ApiError } from "@/lib/api";
import { formatDuration, formatWordCount } from "@/lib/formatters";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useFavorites } from "@/hooks/useFavorites";
import TagBadge from "@/components/TagBadge";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ShareButton from "@/components/ShareButton";
import type { PostDetail } from "@/lib/types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function PostDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="h-4 w-24 bg-[var(--bg-elevated)] rounded mb-8" />
      <div className="flex items-center gap-3 mb-4">
        <div className="h-3 w-28 bg-[var(--bg-elevated)] rounded" />
        <div className="h-3 w-32 bg-[var(--bg-elevated)] rounded" />
      </div>
      <div className="h-8 w-full bg-[var(--bg-elevated)] rounded mb-2" />
      <div className="h-8 w-3/4 bg-[var(--bg-elevated)] rounded mb-6" />
      <div className="h-4 w-32 bg-[var(--bg-elevated)] rounded mb-4" />
      <div className="flex gap-2 mb-6">
        <div className="h-6 w-16 bg-[var(--bg-elevated)] rounded-full" />
        <div className="h-6 w-20 bg-[var(--bg-elevated)] rounded-full" />
        <div className="h-6 w-14 bg-[var(--bg-elevated)] rounded-full" />
      </div>
      <div className="flex gap-3 mb-6">
        <div className="h-10 w-24 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="h-10 w-32 bg-[var(--bg-elevated)] rounded-lg" />
      </div>
      <div className="flex gap-4 mb-8">
        <div className="h-3 w-20 bg-[var(--bg-elevated)] rounded" />
        <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded" />
      </div>
      <div className="border-t border-[var(--border-color)] pt-8 space-y-3">
        {[95, 100, 88, 72, 100, 80, 96, 65, 100, 90, 78, 85].map((w, i) => (
          <div
            key={i}
            className="h-3 bg-[var(--bg-elevated)] rounded"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { play, addToQueue } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  async function handleGenerate() {
    if (!post) return;
    setGenerating(true);
    try {
      await triggerGenerate(post.id);
      setPost({ ...post, audio_status: "processing" });
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (!postId || isNaN(postId)) {
      setError("Invalid post ID");
      setLoading(false);
      return;
    }

    async function loadPost() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPost(postId);
        setPost(data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError("not_found");
        } else {
          const message =
            err instanceof Error ? err.message : "Failed to load post";
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  if (loading) {
    return <PostDetailSkeleton />;
  }

  if (error === "not_found" || (!loading && !post)) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-5xl font-bold text-[var(--text-3)] mb-4">404</p>
        <p className="text-[var(--text-2)] text-lg mb-6">Post not found</p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-[var(--blue)] hover:opacity-80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => window.history.length > 1 ? router.back() : router.push('/explore')}
          className="inline-flex items-center gap-2 text-[var(--text-2)] hover:text-[var(--text-1)] text-sm mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="bg-[var(--error)]/10 border-[var(--border-w)] border-[var(--error)] text-[var(--error)] rounded-[var(--radius)] p-4">
          <p className="text-sm">Failed to load post: {error}</p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => window.history.length > 1 ? router.back() : router.push('/explore')}
        className="inline-flex items-center gap-2 text-[var(--text-2)] hover:text-[var(--text-1)] text-sm mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Content card */}
      <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6">
        {/* Source + date header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[var(--tag-bg)] border-[1.5px] border-[var(--border-color)] rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-3)] uppercase tracking-wide">
            {post.source_name}
          </span>
          {post.published_at && (
            <>
              <span className="text-[var(--text-3)]">|</span>
              <span className="text-sm text-[var(--text-3)]">
                {formatDate(post.published_at)}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <div className="flex items-start gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-1)] leading-tight flex-1 break-words">
            {post.title}
          </h1>
          <ShareButton postId={post.id} title={post.title} className="flex-shrink-0 mt-1" />
          <button
            onClick={() => toggleFavorite(post.id)}
            className="flex-shrink-0 mt-1 p-1.5 hover:bg-[var(--bg-hover)] rounded-[var(--radius)] transition-colors cursor-pointer"
            title={isFavorite(post.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite(post.id) ? "text-[var(--error)] fill-[var(--error)]" : "text-[var(--text-3)] hover:text-[var(--text-2)]"}`}
            />
          </button>
        </div>

        {/* Author */}
        {post.author && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-2)] mb-5">
            <User className="w-4 h-4" />
            <span>{post.author}</span>
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <TagBadge key={tag} name={tag} onClick={() => router.push(`/explore?tag=${encodeURIComponent(tag)}`)} />
            ))}
          </div>
        )}

        {/* Audio controls */}
        <div className="flex items-center gap-3 mb-6">
          {post.audio_status === "ready" && (
            <button
              onClick={() => play(post)}
              className="nb-hover inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] text-sm font-medium transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              Play Podcast
            </button>
          )}
          {(post.audio_status === "pending" || post.audio_status === "failed") && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="nb-hover inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] hover:opacity-90 text-[var(--text-1)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {generating ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {generating ? "Generating..." : "Generate Podcast"}
            </button>
          )}
          {post.audio_status === "processing" && (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--warning)]/15 text-[var(--warning)] text-sm font-medium rounded-[var(--radius)] border-[var(--border-w)] border-[var(--warning)]/40">
              <Loader className="w-4 h-4 animate-spin" />
              Generating audio...
            </span>
          )}
          {post.audio_status === "ready" && (
            <button
              onClick={() => addToQueue(post)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add to Queue
            </button>
          )}
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-5 text-sm text-[var(--text-3)] mb-8">
          {post.word_count && <span>{formatWordCount(post.word_count)}</span>}
          {post.audio_duration_secs && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(post.audio_duration_secs)}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--split)] mb-8" />

        {/* Full text content */}
        {post.full_text ? (
          <MarkdownRenderer content={post.full_text} />
        ) : (
          <p className="text-[var(--text-3)] italic">
            Full text not available for this post.
          </p>
        )}

        {/* Divider + original link */}
        <div className="border-t border-[var(--split)] mt-10 pt-6 mb-4">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[var(--blue)] hover:opacity-80 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Read the original article
          </a>
        </div>
      </div>
    </div>
  );
}
