"use client";

import { useState, useMemo } from "react";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/types";

const PAGE_SIZE = 12;

function PostCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-gray-800 rounded" />
        <div className="h-3 w-16 bg-gray-800 rounded" />
      </div>
      <div className="h-5 w-full bg-gray-800 rounded" />
      <div className="h-5 w-3/4 bg-gray-800 rounded" />
      <div className="h-3 w-24 bg-gray-800 rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-800 rounded" />
        <div className="h-3 w-5/6 bg-gray-800 rounded" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-14 bg-gray-800 rounded-full" />
        <div className="h-5 w-18 bg-gray-800 rounded-full" />
        <div className="h-5 w-12 bg-gray-800 rounded-full" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
        <div className="h-8 w-16 bg-gray-800 rounded-lg" />
        <div className="h-8 w-28 bg-gray-800 rounded-lg ml-auto" />
      </div>
    </div>
  );
}

export default function Home() {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const params = useMemo(
    () => ({ sort: "newest", limit, offset: 0 }),
    [limit]
  );

  const { posts, total, loading, error } = usePosts(params);

  function handleLoadMore() {
    setLimit((prev) => prev + PAGE_SIZE);
  }

  function handlePlay(post: Post) {
    // Placeholder for audio player integration
    console.log("Play:", post.id, post.title);
  }

  const hasMore = posts.length < total;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Latest Episodes</h1>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg p-4 mb-6">
          <p className="text-sm">Failed to load posts: {error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && posts.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No episodes yet</p>
          <p className="text-gray-500 text-sm">
            Your tech blog podcast feed will appear here. Run the crawler to get
            started.
          </p>
        </div>
      )}

      {/* Post grid */}
      {posts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onPlay={handlePlay} />
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
                {loading ? "Loading..." : `Load More (${posts.length} of ${total})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
