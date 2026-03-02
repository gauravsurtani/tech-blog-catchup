"use client";

import Link from "next/link";
import { Clock, Radio } from "lucide-react";
import type { Post } from "@/lib/types";

interface CarouselCardProps {
  post: Post;
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

export default function CarouselCard({ post }: CarouselCardProps) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex-shrink-0 w-48 sm:w-56 snap-start bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-2.5 shadow-[var(--shadow)] nb-hover transition-all group"
    >
      {/* Source icon + name */}
      <div className="flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-[var(--text-3)] flex-shrink-0" />
        <span className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wide truncate">
          {post.source_name}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-[var(--text-1)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-snug">
        {post.title}
      </h3>

      {/* Footer: duration */}
      <div className="mt-auto flex items-center justify-end text-xs text-[var(--text-3)]">
        {post.audio_duration_secs ? (
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {formatDuration(post.audio_duration_secs)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
