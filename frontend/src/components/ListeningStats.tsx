"use client";

import { useState, useEffect } from "react";
import { Headphones, Clock, TrendingUp, BarChart3, History } from "lucide-react";
import { getPosts } from "@/lib/api";
import type { Post } from "@/lib/types";
import Link from "next/link";

interface PlaybackPosition {
  position: number;
  duration: number;
  updatedAt: string;
}

type PlaybackPositions = Record<string, PlaybackPosition>;

const PLAYBACK_POSITIONS_KEY = "tbc-playback-positions";
const COMPLETED_THRESHOLD = 0.9;

interface ListeningData {
  totalPosts: number;
  totalTimeSecs: number;
  avgPerDaySecs: number;
  topSources: { name: string; count: number }[];
  recentlyCompleted: Post[];
  memberSince: string | null;
}

function formatDuration(totalSecs: number): string {
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getPlaybackPositions(): PlaybackPositions {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PLAYBACK_POSITIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[var(--text-3)]">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-2xl font-extrabold text-[var(--text-1)]">{value}</span>
    </div>
  );
}

function SourceBar({
  name,
  count,
  maxCount,
}: {
  name: string;
  count: number;
  maxCount: number;
}) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--text-2)] w-24 truncate shrink-0">
        {name}
      </span>
      <div className="flex-1 h-5 bg-[var(--tag-bg)] rounded-[var(--radius)] overflow-hidden border-[1.5px] border-[var(--border-color)]">
        <div
          className="h-full bg-[var(--primary)] rounded-[var(--radius)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-[var(--text-1)] w-8 text-right shrink-0">
        {count}
      </span>
    </div>
  );
}

export default function ListeningStats() {
  const [data, setData] = useState<ListeningData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const positions = getPlaybackPositions();
        const entries = Object.entries(positions);

        if (entries.length === 0) {
          if (!cancelled) {
            setData({
              totalPosts: 0,
              totalTimeSecs: 0,
              avgPerDaySecs: 0,
              topSources: [],
              recentlyCompleted: [],
              memberSince: null,
            });
            setLoading(false);
          }
          return;
        }

        // Find earliest listening timestamp
        const timestamps = entries.map(([, p]) => new Date(p.updatedAt).getTime());
        const earliest = new Date(Math.min(...timestamps)).toISOString();

        // Compute total time listened (sum of positions)
        const totalTimeSecs = entries.reduce((acc, [, p]) => acc + p.position, 0);

        // Days since first listen
        const daysSinceFirst = Math.max(
          1,
          Math.ceil((Date.now() - Math.min(...timestamps)) / (1000 * 60 * 60 * 24))
        );
        const avgPerDaySecs = totalTimeSecs / daysSinceFirst;

        // Find completed posts (position/duration > 0.9)
        const completedEntries = entries
          .filter(([, p]) => p.duration > 0 && p.position / p.duration >= COMPLETED_THRESHOLD)
          .sort(
            ([, a], [, b]) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, 10);

        // Fetch all listened posts in one batch
        const allIds = entries.map(([id]) => Number(id));
        const { posts: allPosts } = await getPosts({ ids: allIds, limit: allIds.length });

        if (cancelled) return;

        // Filter completed posts
        const completedIds = new Set(completedEntries.map(([id]) => Number(id)));
        const completedPosts = allPosts.filter(p => completedIds.has(p.id));

        // Count sources
        const sourceCounts: Record<string, number> = {};
        for (const post of allPosts) {
          const key = post.source_name;
          sourceCounts[key] = (sourceCounts[key] || 0) + 1;
        }
        const topSources = Object.entries(sourceCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setData({
          totalPosts: entries.length,
          totalTimeSecs,
          avgPerDaySecs,
          topSources,
          recentlyCompleted: completedPosts,
          memberSince: earliest,
        });
      } catch {
        // ignore errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--text-3)] border-t-[var(--primary)]" />
      </div>
    );
  }

  if (!data) return null;

  const maxSourceCount = data.topSources.length > 0 ? data.topSources[0].count : 0;

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Headphones size={16} />}
          label="Posts Listened"
          value={String(data.totalPosts)}
        />
        <StatCard
          icon={<Clock size={16} />}
          label="Total Time"
          value={formatDuration(data.totalTimeSecs)}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Avg Per Day"
          value={formatDuration(data.avgPerDaySecs)}
        />
      </div>

      {/* Top Sources */}
      {data.topSources.length > 0 && (
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-[var(--text-3)]" />
            <h3 className="text-sm font-bold text-[var(--text-1)] uppercase tracking-wide">
              Top Sources
            </h3>
          </div>
          <div className="space-y-3">
            {data.topSources.map((source) => (
              <SourceBar
                key={source.name}
                name={source.name}
                count={source.count}
                maxCount={maxSourceCount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {data.recentlyCompleted.length > 0 && (
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <History size={16} className="text-[var(--text-3)]" />
            <h3 className="text-sm font-bold text-[var(--text-1)] uppercase tracking-wide">
              Recently Completed
            </h3>
          </div>
          <div className="divide-y divide-[var(--split)]">
            {data.recentlyCompleted.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-[var(--radius)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-1)] truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-[var(--text-3)] mt-0.5">
                    {post.source_name}
                    {post.audio_duration_secs
                      ? ` \u00b7 ${formatDuration(post.audio_duration_secs)}`
                      : ""}
                  </p>
                </div>
                <span className="text-xs text-[var(--primary)] font-medium ml-3 shrink-0">
                  Completed
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.totalPosts === 0 && (
        <div className="text-center py-12">
          <Headphones size={48} className="mx-auto text-[var(--text-3)] mb-4" />
          <p className="text-[var(--text-2)] text-sm">
            No listening history yet. Start playing some podcasts!
          </p>
        </div>
      )}
    </div>
  );
}
