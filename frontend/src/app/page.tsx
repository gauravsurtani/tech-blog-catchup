"use client";

import { useState, useMemo, useCallback } from "react";
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
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-800/50 animate-pulse">
      <div className="flex-shrink-0 w-7 h-7 bg-gray-800 rounded-full" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-4 w-3/4 bg-gray-800 rounded" />
        <div className="h-3 w-1/2 bg-gray-800 rounded" />
      </div>
      <div className="h-5 w-16 bg-gray-800 rounded-full hidden sm:block" />
      <div className="h-4 w-12 bg-gray-800 rounded hidden sm:block" />
      <div className="w-7 h-7 bg-gray-800 rounded-md" />
    </div>
  );
}

export default function Home() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { play, addToQueue } = useAudioPlayer();

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
      <h1 className="text-3xl font-bold mb-6">Your Podcast Feed</h1>

      <ContinueListening />
      <HomeSections />

      {posts.length > 0 && (
        <h2 className="text-xl font-bold text-gray-100 mt-10 mb-4">
          All Episodes
        </h2>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg p-4 mb-6">
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
          <p className="text-gray-400 text-lg mb-2">No episodes ready yet</p>
          <p className="text-gray-500 text-sm">
            Posts with generated audio will appear here.{" "}
            <Link
              href="/explore"
              className="text-blue-400 hover:text-blue-300 underline"
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
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="text-center mt-8 py-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            {pendingCount} more{" "}
            {pendingCount === 1 ? "post" : "posts"} pending audio
            generation.{" "}
            <Link
              href="/explore"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              View in Explore
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
