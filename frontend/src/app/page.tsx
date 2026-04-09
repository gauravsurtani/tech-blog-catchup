"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePosts } from "@/hooks/usePosts";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import PostListItem from "@/components/PostListItem";
import HomeSections from "@/components/HomeSections";
import ContinueListening from "@/components/ContinueListening";
import type { Post } from "@/lib/types";

const PAGE_SIZE = 12;

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[var(--border-color)] animate-pulse">
      <div className="flex-shrink-0 w-7 h-7 bg-[var(--bg-elevated)] rounded-full" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-4 w-3/4 bg-[var(--bg-elevated)] rounded" />
        <div className="h-3 w-1/2 bg-[var(--bg-elevated)] rounded" />
      </div>
      <div className="h-5 w-16 bg-[var(--bg-elevated)] rounded-full hidden sm:block" />
      <div className="h-4 w-12 bg-[var(--bg-elevated)] rounded hidden sm:block" />
      <div className="w-7 h-7 bg-[var(--bg-elevated)] rounded-md" />
    </div>
  );
}

const VISITED_KEY = "catchup-visited";

export default function Home() {
  const router = useRouter();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { play, addToQueue } = useAudioPlayer();

  // First-time visitors go to the landing page
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(VISITED_KEY)) {
      localStorage.setItem(VISITED_KEY, "1");
      router.replace("/landing");
    }
  }, [router]);

  // Only show audio-ready posts on the Home (Podcast Feed) page
  const params = useMemo(
    () => ({ sort: "newest", limit, offset: 0, audio_status: "ready" }),
    [limit],
  );

  // Also fetch total posts count (all statuses) for the pending message
  const allPostsParams = useMemo(
    () => ({ sort: "newest", limit: 1, offset: 0 }),
    [],
  );

  const { posts, total, loading, error } = usePosts(params);
  const { total: totalAll, loading: loadingAll } = usePosts(allPostsParams);

  const pendingCount = totalAll - total;

  function handleLoadMore() {
    setLimit((prev) => prev + PAGE_SIZE);
  }

  const handlePlay = useCallback(
    (post: Post) => {
      play(post);
    },
    [play],
  );

  const handleAddToQueue = useCallback(
    (post: Post) => {
      addToQueue(post);
    },
    [addToQueue],
  );

  const hasMore = posts.length < total;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-extrabold text-[var(--text-1)]">Your Podcast Feed</h1>
        {!loading && total > 0 && (
          <span className="border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-full)] shadow-[var(--shadow-sm)] bg-[var(--bg-elevated)] text-[var(--text-2)] px-3 py-1 text-sm font-bold">
            {total} episodes
          </span>
        )}
      </div>

      <ContinueListening />
      <HomeSections />

      {posts.length > 0 && (
        <h2 className="text-xl font-bold text-[var(--text-1)] mt-10 mb-4">
          All Episodes
        </h2>
      )}

      {error && (
        <div className="bg-[var(--error-bg)] border border-[var(--error)] text-[var(--error)] rounded-lg p-4 mb-6">
          <p className="text-sm">Failed to load posts: {error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && posts.length === 0 && (
        <div className="flex flex-col">
          {Array.from({ length: 10 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-[var(--text-2)] text-lg mb-2">No episodes ready yet</p>
          <p className="text-[var(--text-3)] text-sm">
            Posts with generated audio will appear here.{" "}
            <Link
              href="/explore"
              className="text-[var(--primary)] hover:underline font-semibold"
            >
              Browse all posts
            </Link>{" "}
            to discover content and generate podcasts.
          </p>
        </div>
      )}

      {/* Post list */}
      {posts.length > 0 && (
        <>
          <div className="flex flex-col">
            {posts.map((post) => (
              <PostListItem
                key={post.id}
                post={post}
                onPlay={handlePlay}
                onAddToQueue={handleAddToQueue}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] text-sm font-medium rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading
                  ? "Loading..."
                  : `Load More (${posts.length} of ${total})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Pending posts link */}
      {!loading && !loadingAll && pendingCount > 0 && (
        <div className="text-center mt-8 py-4 border-t border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-3)]">
            {pendingCount} more{" "}
            {pendingCount === 1 ? "post" : "posts"} pending audio
            generation.{" "}
            <Link
              href="/explore"
              className="text-[var(--primary)] hover:underline font-semibold"
            >
              View in Explore
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
