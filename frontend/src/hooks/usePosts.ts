"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPosts, type PostsParams } from "@/lib/api";
import type { Post } from "@/lib/types";

interface UsePostsOptions {
  params: PostsParams;
  /** When set, re-fetches posts on this interval (ms). Pass 0 or undefined to disable. */
  refetchInterval?: number;
}

interface UsePostsResult {
  posts: Post[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePosts(
  paramsOrOptions: PostsParams | UsePostsOptions,
): UsePostsResult {
  // Support both old signature (just params) and new options object
  const options: UsePostsOptions =
    "params" in paramsOrOptions ? paramsOrOptions : { params: paramsOrOptions };
  const { params, refetchInterval } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Serialize params to a stable string for use as a dependency
  const paramsKey = JSON.stringify(params);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPosts(params);
      setPosts(data.posts);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Silent refetch that doesn't flip loading state (avoids UI flicker during polling)
  const silentRefetch = useCallback(async () => {
    try {
      const data = await getPosts(params);
      setPosts(data.posts);
      setTotal(data.total);
    } catch {
      // Silently ignore polling errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (refetchInterval && refetchInterval > 0) {
      intervalRef.current = setInterval(silentRefetch, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, silentRefetch]);

  return { posts, total, loading, error, refetch: fetchData };
}
