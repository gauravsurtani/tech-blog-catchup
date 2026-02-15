"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { getPost, triggerGenerate, ApiError } from "@/lib/api";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TagBadge from "@/components/TagBadge";
import MarkdownRenderer from "@/components/MarkdownRenderer";
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

function formatWordCount(count: number | null): string {
  if (!count) return "";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k words`;
  }
  return `${count} words`;
}

function PostDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="h-4 w-24 bg-gray-800 rounded mb-8" />
      <div className="flex items-center gap-3 mb-4">
        <div className="h-3 w-28 bg-gray-800 rounded" />
        <div className="h-3 w-32 bg-gray-800 rounded" />
      </div>
      <div className="h-8 w-full bg-gray-800 rounded mb-2" />
      <div className="h-8 w-3/4 bg-gray-800 rounded mb-6" />
      <div className="h-4 w-32 bg-gray-800 rounded mb-4" />
      <div className="flex gap-2 mb-6">
        <div className="h-6 w-16 bg-gray-800 rounded-full" />
        <div className="h-6 w-20 bg-gray-800 rounded-full" />
        <div className="h-6 w-14 bg-gray-800 rounded-full" />
      </div>
      <div className="flex gap-3 mb-6">
        <div className="h-10 w-24 bg-gray-800 rounded-lg" />
        <div className="h-10 w-32 bg-gray-800 rounded-lg" />
      </div>
      <div className="flex gap-4 mb-8">
        <div className="h-3 w-20 bg-gray-800 rounded" />
        <div className="h-3 w-24 bg-gray-800 rounded" />
      </div>
      <div className="border-t border-gray-800 pt-8 space-y-3">
        {[95, 100, 88, 72, 100, 80, 96, 65, 100, 90, 78, 85].map((w, i) => (
          <div
            key={i}
            className="h-3 bg-gray-800 rounded"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = Number(params.id);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { play, addToQueue } = useAudioPlayer();

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
        <p className="text-5xl font-bold text-gray-600 mb-4">404</p>
        <p className="text-gray-400 text-lg mb-6">Post not found</p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
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
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg p-4">
          <p className="text-sm">Failed to load post: {error}</p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </Link>

      {/* Source + date header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {post.source_name}
        </span>
        {post.published_at && (
          <>
            <span className="text-gray-700">|</span>
            <span className="text-sm text-gray-400">
              {formatDate(post.published_at)}
            </span>
          </>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 leading-tight mb-4">
        {post.title}
      </h1>

      {/* Author */}
      {post.author && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <User className="w-4 h-4" />
          <span>{post.author}</span>
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <TagBadge key={tag} name={tag} />
          ))}
        </div>
      )}

      {/* Audio controls */}
      <div className="flex items-center gap-3 mb-6">
        {post.audio_status === "ready" && (
          <button
            onClick={() => play(post)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Play Podcast
          </button>
        )}
        {(post.audio_status === "pending" || post.audio_status === "failed") && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/40 text-yellow-400 text-sm font-medium rounded-lg border border-yellow-700/40">
            <Loader className="w-4 h-4 animate-spin" />
            Generating audio...
          </span>
        )}
        {post.audio_status === "ready" && (
          <button
            onClick={() => addToQueue(post)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add to Queue
          </button>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-5 text-sm text-gray-500 mb-8">
        {post.word_count && <span>{formatWordCount(post.word_count)}</span>}
        {post.audio_duration_secs && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(post.audio_duration_secs)}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800 mb-8" />

      {/* Full text content */}
      {post.full_text ? (
        <MarkdownRenderer content={post.full_text} />
      ) : (
        <p className="text-gray-500 italic">
          Full text not available for this post.
        </p>
      )}

      {/* Divider + original link */}
      <div className="border-t border-gray-800 mt-10 pt-6 mb-4">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Read the original article
        </a>
      </div>
    </div>
  );
}
