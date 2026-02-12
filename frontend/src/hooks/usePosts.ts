"use client";

import { useState, useEffect, useCallback } from "react";
import { getPosts, type PostsParams } from "@/lib/api";
import type { Post } from "@/lib/types";

interface UsePostsResult {
  posts: Post[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePosts(params: PostsParams): UsePostsResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { posts, total, loading, error, refetch: fetchData };
}
