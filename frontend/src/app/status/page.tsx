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
} from "lucide-react";
import { getCrawlStatus, triggerCrawl, triggerGenerate } from "@/lib/api";
import type { CrawlStatusItem } from "@/lib/types";

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
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-400" />;
    case "running":
      return <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />;
    default:
      return <Circle className="w-5 h-5 text-gray-600" />;
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
      return "text-green-400";
    case "error":
      return "text-red-400";
    case "running":
      return "text-yellow-400";
    default:
      return "text-gray-500";
  }
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Scrape Status</h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor which tech blogs are being scraped successfully
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || crawling !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${generating ? "animate-spin" : ""}`}
            />
            Generate Podcasts
          </button>
          <button
            onClick={handleCrawlAll}
            disabled={crawling !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${crawling === "__all__" ? "animate-spin" : ""}`}
            />
            Crawl All Sources
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Total Posts
          </p>
          <p className="text-2xl font-bold">{totalPosts}</p>
        </div>
        <div className="bg-gray-900 border border-green-900/50 rounded-xl p-4">
          <p className="text-xs text-green-500 uppercase tracking-wide mb-1">
            Healthy
          </p>
          <p className="text-2xl font-bold text-green-400">{successCount}</p>
        </div>
        <div className="bg-gray-900 border border-red-900/50 rounded-xl p-4">
          <p className="text-xs text-red-500 uppercase tracking-wide mb-1">
            Errors
          </p>
          <p className="text-2xl font-bold text-red-400">{errorCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Not Crawled
          </p>
          <p className="text-2xl font-bold text-gray-500">{neverCount}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg p-4 mb-6">
          <p className="text-sm">Failed to load status: {error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 bg-gray-800 rounded-full" />
                <div className="h-4 w-40 bg-gray-800 rounded" />
                <div className="ml-auto h-4 w-20 bg-gray-800 rounded" />
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
              className={`bg-gray-900 border rounded-xl p-4 transition-colors ${
                source.status === "error"
                  ? "border-red-900/50"
                  : source.status === "success"
                  ? "border-green-900/30"
                  : "border-gray-800"
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
                        className="font-semibold text-gray-100 hover:text-blue-400 transition-colors inline-flex items-center gap-1.5"
                      >
                        {source.source_name}
                        <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                      </a>
                    ) : (
                      <h3 className="font-semibold text-gray-100">
                        {source.source_name}
                      </h3>
                    )}
                    <span
                      className={`text-xs font-medium ${statusColor(source.status)}`}
                    >
                      {statusLabel(source.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <a
                      href={source.feed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                    >
                      <Rss className="w-3 h-3" />
                      {source.source_key}
                    </a>
                    <span>{source.post_count} posts</span>
                    {source.last_crawl_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(source.last_crawl_at)}
                      </span>
                    )}
                    {source.posts_added_last !== null &&
                      source.posts_added_last > 0 && (
                        <span className="text-green-500">
                          +{source.posts_added_last} new
                        </span>
                      )}
                    {source.urls_found_last !== null && (
                      <span>{source.urls_found_last} URLs found</span>
                    )}
                  </div>
                  {/* Error message */}
                  {source.error_message && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{source.error_message}</span>
                    </div>
                  )}
                </div>

                {/* Crawl button */}
                <button
                  onClick={() => handleCrawl(source.source_key)}
                  disabled={crawling !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
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
  );
}
