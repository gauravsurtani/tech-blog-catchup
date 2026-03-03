"use client";

import { useState, useEffect } from "react";
import { Clock, Radio, Play } from "lucide-react";
import { getPosts } from "@/lib/api";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { Post } from "@/lib/types";
import Carousel from "@/components/Carousel";

interface PlaybackPosition {
  position: number;
  duration: number;
  updatedAt: string;
}

type PlaybackPositions = Record<string, PlaybackPosition>;

const PLAYBACK_POSITIONS_KEY = "tbc-playback-positions";
const MIN_PROGRESS = 0.02;
const MAX_PROGRESS = 0.95;

interface TrackWithProgress {
  post: Post;
  position: number;
  duration: number;
  progress: number;
}

function formatTimeLeft(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m left`;
  }
  return `${mins}m left`;
}

function ContinueCard({ track }: { track: TrackWithProgress }) {
  const { play } = useAudioPlayer();
  const timeLeft = track.duration - track.position;
  const pct = Math.round(track.progress * 100);

  return (
    <button
      onClick={() => play(track.post)}
      className="flex-shrink-0 w-48 sm:w-56 snap-start bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-2.5 shadow-[var(--shadow)] nb-hover transition-colors group text-left cursor-pointer"
    >
      {/* Source */}
      <div className="flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-[var(--text-3)] flex-shrink-0" />
        <span className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wide truncate">
          {track.post.source_name}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-[var(--text-1)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-snug">
        {track.post.title}
      </h3>

      {/* Progress bar */}
      <div className="mt-auto space-y-1.5">
        <div className="w-full h-3 rounded-full border-[1.5px] border-[var(--border-color)] bg-[var(--tag-bg)] p-[2px]">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeLeft(timeLeft)}
          </span>
          <span className="flex items-center gap-1 text-[var(--text-2)] group-hover:text-[var(--primary)] transition-colors">
            <Play className="w-3 h-3" />
            Resume
          </span>
        </div>
      </div>
    </button>
  );
}

export default function ContinueListening() {
  const [tracks, setTracks] = useState<TrackWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = localStorage.getItem(PLAYBACK_POSITIONS_KEY);
        if (!raw) {
          setLoading(false);
          return;
        }

        const positions: PlaybackPositions = JSON.parse(raw);
        const entries = Object.entries(positions)
          .filter(([, p]) => {
            if (p.duration <= 0) return false;
            const progress = p.position / p.duration;
            return progress >= MIN_PROGRESS && progress <= MAX_PROGRESS;
          })
          .sort(
            ([, a], [, b]) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          .slice(0, 10);

        if (entries.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        const allIds = entries.map(([id]) => Number(id));
        const { posts } = await getPosts({ ids: allIds, limit: allIds.length });

        if (cancelled) return;

        const postMap = new Map(posts.map(p => [p.id, p]));
        const resolved: TrackWithProgress[] = [];
        for (const [id, pos] of entries) {
          const post = postMap.get(Number(id));
          if (post && post.audio_status === "ready") {
            resolved.push({
              post,
              position: pos.position,
              duration: pos.duration,
              progress: pos.position / pos.duration,
            });
          }
        }

        setTracks(resolved);
      } catch {
        // ignore parse errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || tracks.length === 0) return null;

  return (
    <Carousel title="Continue Listening">
      {tracks.map((track) => (
        <ContinueCard key={track.post.id} track={track} />
      ))}
    </Carousel>
  );
}
