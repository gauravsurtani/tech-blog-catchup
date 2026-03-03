"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Circle,
  Rss,
  AlertTriangle,
  ExternalLink,
  Loader,
} from "lucide-react";
import { getCrawlStatus, triggerCrawl, triggerGenerate } from "@/lib/api";
import type { CrawlStatusItem } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />;
    case "error":
      return <XCircle className="w-5 h-5 text-[var(--error)]" />;
    case "running":
      return <RefreshCw className="w-5 h-5 text-[var(--warning)] animate-spin" />;
    default:
      return <Circle className="w-5 h-5 text-[var(--text-3)]" />;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "success":
      return "Healthy";
    case "error":
      return "Error";
    case "running":
      return "Running";
    default:
      return "Not crawled";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "success":
      return "text-[var(--primary)]";
    case "error":
      return "text-[var(--error)]";
    case "running":
      return "text-[var(--warning)]";
    default:
      return "text-[var(--text-3)]";
  }
}

function ProgressIndicator({ scraped, total }: { scraped: number; total: number | null }) {
  if (!total || total === 0) return <span>{scraped} posts</span>;
  const pct = Math.min(100, Math.round((scraped / total) * 100));
  return (
    <div className="flex items-center gap-2">
      <span>{scraped} / {total}</span>
      <div
        className="w-16 h-3 rounded-full border-[1.5px] border-[var(--border-color)] bg-[var(--tag-bg)] p-[2px] overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% scraped`}
      >
        <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[var(--text-3)]">{pct}%</span>
    </div>
  );
}

export default function StatusPage() {
  const [sources, setSources] = useState<CrawlStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await getCrawlStatus();
      setSources(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10_000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  async function handleCrawl(sourceKey: string) {
    setCrawling(sourceKey);
    try {
      await triggerCrawl(sourceKey);
      // Wait a moment then refresh
      setTimeout(loadStatus, 2000);
    } catch (err) {
      console.error("Crawl trigger failed:", err);
    } finally {
      setTimeout(() => setCrawling(null), 3000);
    }
  }

  async function handleCrawlAll() {
    setCrawling("__all__");
    try {
      await triggerCrawl(undefined);
      setTimeout(loadStatus, 5000);
    } catch (err) {
      console.error("Crawl all failed:", err);
    } finally {
      setTimeout(() => setCrawling(null), 5000);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await triggerGenerate(undefined, 10);
      setTimeout(loadStatus, 5000);
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setTimeout(() => setGenerating(false), 5000);
    }
  }

  const successCount = sources.filter((s) => s.status === "success").length;
  const errorCount = sources.filter((s) => s.status === "error").length;
  const neverCount = sources.filter((s) => s.status === "never").length;
  const totalPosts = sources.reduce((sum, s) => sum + s.post_count, 0);

  return (
    <AuthGuard>
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-1)]">Scrape Status</h1>
          <p className="text-[var(--text-2)] text-sm mt-1">
            Monitor which tech blogs are being scraped successfully
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || crawling !== null}
            className="nb-hover inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {generating ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {generating ? "Generating..." : "Generate Podcasts"}
          </button>
          <button
            onClick={handleCrawlAll}
            disabled={crawling !== null}
            className="nb-hover inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--blue)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${crawling === "__all__" ? "animate-spin" : ""}`}
            />
            Crawl All Sources
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-4">
          <p className="text-xs text-[var(--text-3)] uppercase tracking-wide mb-1">
            Total Posts
          </p>
          <p className="text-3xl font-extrabold text-[var(--text-1)]">{totalPosts}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--primary)]/30 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-4">
          <p className="text-xs text-[var(--primary)] uppercase tracking-wide mb-1">
            Healthy
          </p>
          <p className="text-3xl font-extrabold text-[var(--primary)]">{successCount}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--error)]/30 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-4">
          <p className="text-xs text-[var(--error)] uppercase tracking-wide mb-1">
            Errors
          </p>
          <p className="text-3xl font-extrabold text-[var(--error)]">{errorCount}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-4">
          <p className="text-xs text-[var(--text-3)] uppercase tracking-wide mb-1">
            Not Crawled
          </p>
          <p className="text-3xl font-extrabold text-[var(--text-3)]">{neverCount}</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--blue)]/30 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-4">
          <p className="text-xs text-[var(--blue)] uppercase tracking-wide mb-1">
            Discoverable
          </p>
          <p className="text-3xl font-extrabold text-[var(--blue)]">
            {(() => {
              const total = sources.reduce((sum, s) => sum + (s.total_discoverable ?? 0), 0);
              return total > 0 ? total.toLocaleString() : "--";
            })()}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-[var(--error)]/10 border-[var(--border-w)] border-[var(--error)]/50 text-[var(--error)] rounded-[var(--radius)] p-4 mb-6">
          <p className="text-sm">Failed to load status: {error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] p-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 bg-[var(--bg-hover)] rounded-full" />
                <div className="h-4 w-40 bg-[var(--bg-hover)] rounded" />
                <div className="ml-auto h-4 w-20 bg-[var(--bg-hover)] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Source list */}
      {!loading && sources.length > 0 && (
        <div className="space-y-3">
          {sources.map((source) => (
            <div
              key={source.source_key}
              className={`bg-[var(--bg-elevated)] border-[var(--border-w)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-4 transition-colors ${
                source.status === "error"
                  ? "border-[var(--error)]/50"
                  : source.status === "success"
                  ? "border-[var(--primary)]/30"
                  : "border-[var(--border-color)]"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Status icon */}
                <StatusIcon status={source.status} />

                {/* Source info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {source.blog_url ? (
                      <a
                        href={source.blog_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[var(--text-1)] hover:text-[var(--blue)] transition-colors inline-flex items-center gap-1.5"
                      >
                        {source.source_name}
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--text-3)]" />
                      </a>
                    ) : (
                      <h3 className="font-semibold text-[var(--text-1)]">
                        {source.source_name}
                      </h3>
                    )}
                    <span
                      className={`text-xs font-medium ${statusColor(source.status)}`}
                    >
                      {statusLabel(source.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-3)]">
                    <a
                      href={source.feed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[var(--blue)] transition-colors"
                    >
                      <Rss className="w-3 h-3" />
                      {source.source_key}
                    </a>
                    <ProgressIndicator scraped={source.post_count} total={source.total_discoverable} />
                    {source.last_crawl_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(source.last_crawl_at)}
                      </span>
                    )}
                    {source.posts_added_last !== null &&
                      source.posts_added_last > 0 && (
                        <span className="text-[var(--primary)]">
                          +{source.posts_added_last} new
                        </span>
                      )}
                    {source.urls_found_last !== null && (
                      <span>{source.urls_found_last} URLs found</span>
                    )}
                  </div>
                  {/* Error message */}
                  {source.error_message && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-[var(--error)]">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{source.error_message}</span>
                    </div>
                  )}
                </div>

                {/* Crawl button */}
                <button
                  onClick={() => handleCrawl(source.source_key)}
                  disabled={crawling !== null}
                  className="nb-hover inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      crawling === source.source_key ? "animate-spin" : ""
                    }`}
                  />
                  Crawl
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
