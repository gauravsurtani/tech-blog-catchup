"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  FileText,
  Heart,
  Mic,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader,
  Rss,
  BarChart3,
} from "lucide-react";
import type { MonitoringStats } from "@/lib/api";
import { getMonitoringStats, getFeedUrl } from "@/lib/api";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-lg)]">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center bg-[var(--tag-bg)]">
          <Icon className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <span className="text-sm font-medium text-[var(--text-3)]">{label}</span>
      </div>
      <p className="text-3xl font-extrabold text-[var(--text-1)]">{value}</p>
    </div>
  );
}

function AudioPieChart({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const statusColors: Record<string, string> = {
    ready: "var(--cyan)",
    pending: "var(--orange)",
    processing: "var(--primary)",
    failed: "var(--error)",
  };

  return (
    <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-lg)]">
      <h3 className="text-sm font-bold text-[var(--text-2)] mb-4 flex items-center gap-2">
        <Mic className="w-4 h-4" /> Audio Status Breakdown
      </h3>
      <div className="space-y-3">
        {Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .map(([status, count]) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-[var(--text-2)]">{status}</span>
                  <span className="font-bold text-[var(--text-1)]">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: statusColors[status] || "var(--text-3)",
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function JobsPanel({
  jobs,
}: {
  jobs: { total: number; completed: number; failed: number; running: number; queued?: number };
}) {
  return (
    <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-lg)]">
      <h3 className="text-sm font-bold text-[var(--text-2)] mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" /> Generation Jobs
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[var(--cyan)]" />
          <span className="text-sm text-[var(--text-2)]">Completed</span>
          <span className="ml-auto font-bold text-[var(--text-1)]">{jobs.completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-sm text-[var(--text-2)]">Running</span>
          <span className="ml-auto font-bold text-[var(--text-1)]">{jobs.running}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--orange)]" />
          <span className="text-sm text-[var(--text-2)]">Queued</span>
          <span className="ml-auto font-bold text-[var(--text-1)]">{jobs.queued ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--error)]" />
          <span className="text-sm text-[var(--text-2)]">Failed</span>
          <span className="ml-auto font-bold text-[var(--text-1)]">{jobs.failed}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/admin");
      return;
    }
    if (status !== "authenticated" || !session) return;

    async function load() {
      try {
        // Extract JWT from cookie
        const cookies = document.cookie.split(";").map((c) => c.trim());
        let token: string | null = null;
        for (const cookie of cookies) {
          for (const prefix of [
            "next-auth.session-token=",
            "__Secure-next-auth.session-token=",
            "authjs.session-token=",
            "__Secure-authjs.session-token=",
          ]) {
            if (cookie.startsWith(prefix)) {
              token = cookie.slice(prefix.length);
              break;
            }
          }
          if (token) break;
        }
        if (!token) {
          setError("Unable to retrieve auth token");
          setLoading(false);
          return;
        }
        const data = await getMonitoringStats(token);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-[var(--error-bg)] border border-[var(--error)] text-[var(--error)] rounded-lg p-4">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-1)]">Admin Dashboard</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">
            Monitor user activity, content, and system health
          </p>
        </div>
        <a
          href={getFeedUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] text-sm font-medium rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-colors"
        >
          <Rss className="w-4 h-4" />
          RSS Feed
        </a>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={stats.total_users} icon={Users} />
        <StatCard label="Total Posts" value={stats.total_posts} icon={FileText} />
        <StatCard label="Favorites" value={stats.total_favorites} icon={Heart} />
        <StatCard label="Audio Ready" value={stats.audio_counts?.ready ?? 0} icon={Mic} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <AudioPieChart counts={stats.audio_counts} />
        <JobsPanel jobs={stats.generation_jobs} />
      </div>

      {/* Source audio breakdown */}
      {stats.source_audio?.length > 0 && (
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-lg)] mb-6">
          <h3 className="text-sm font-bold text-[var(--text-2)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Audio Episodes by Source
          </h3>
          <div className="space-y-2">
            {stats.source_audio.map((item) => {
              const maxCount = Math.max(...stats.source_audio.map((s) => s.ready_count));
              const pct = maxCount > 0 ? Math.round((item.ready_count / maxCount) * 100) : 0;
              return (
                <div key={item.source} className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-2)] w-36 truncate">{item.source}</span>
                  <div className="flex-1 h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-1)] w-10 text-right">
                    {item.ready_count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily activity */}
      {stats.daily_posts?.length > 0 && (
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-lg)] mb-6">
          <h3 className="text-sm font-bold text-[var(--text-2)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Posts Added (Last 30 Days)
          </h3>
          <div className="flex items-end gap-1 h-32">
            {stats.daily_posts
              .slice()
              .reverse()
              .map((day) => {
                const maxDay = Math.max(...stats.daily_posts.map((d) => d.count));
                const heightPct = maxDay > 0 ? Math.max(4, Math.round((day.count / maxDay) * 100)) : 4;
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-[var(--primary)] rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${heightPct}%` }}
                    title={`${day.date}: ${day.count} posts`}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Popular posts */}
      {stats.popular_posts.length > 0 && (
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-lg)] mb-6">
          <h3 className="text-sm font-bold text-[var(--text-2)] mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4" /> Most Favorited Posts
          </h3>
          <div className="space-y-2">
            {stats.popular_posts.map((p, i) => (
              <div key={p.post_id} className="flex items-center gap-3 py-1.5 border-b border-[var(--split)] last:border-0">
                <span className="text-xs font-bold text-[var(--text-3)] w-6">{i + 1}.</span>
                <span className="text-sm text-[var(--text-1)] flex-1 truncate">{p.title}</span>
                <span className="text-sm font-bold text-[var(--error)] flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-current" />
                  {p.favorite_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent users */}
      {stats.recent_users.length > 0 && (
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-lg)]">
          <h3 className="text-sm font-bold text-[var(--text-2)] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Recent Users
          </h3>
          <div className="space-y-2">
            {stats.recent_users.map((u) => (
              <div key={u.email} className="flex items-center gap-3 py-1.5 border-b border-[var(--split)] last:border-0">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-sm font-bold text-[var(--primary-text)]">
                  {(u.name || u.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-1)] truncate">{u.name || u.email}</p>
                  <p className="text-xs text-[var(--text-3)]">{u.provider} &middot; {u.created_at?.split("T")[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
