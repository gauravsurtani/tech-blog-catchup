const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface PostsParams {
  source?: string;
  tag?: string;
  search?: string;
  audio_status?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

import type { PaginatedPosts, PostDetail, Tag, Source, StatusInfo } from "./types";

export function getPosts(params: PostsParams = {}): Promise<PaginatedPosts> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return fetchAPI<PaginatedPosts>(`/api/posts${qs ? `?${qs}` : ""}`);
}

export function getPost(id: number): Promise<PostDetail> {
  return fetchAPI<PostDetail>(`/api/posts/${id}`);
}

export function getTags(): Promise<Tag[]> {
  return fetchAPI<Tag[]>("/api/tags");
}

export function getSources(): Promise<Source[]> {
  return fetchAPI<Source[]>("/api/sources");
}

export function getPlaylist(params: PostsParams = {}): Promise<PaginatedPosts> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return fetchAPI<PaginatedPosts>(`/api/playlist${qs ? `?${qs}` : ""}`);
}

export function getStatus(): Promise<StatusInfo> {
  return fetchAPI<StatusInfo>("/api/status");
}

export function triggerCrawl(source?: string, mode: string = "incremental") {
  return fetchAPI("/api/crawl", {
    method: "POST",
    body: JSON.stringify({ source, mode }),
  });
}

export function triggerGenerate(postId?: number, limit: number = 10) {
  return fetchAPI("/api/generate", {
    method: "POST",
    body: JSON.stringify({ post_id: postId, limit }),
  });
}

export function getAudioUrl(audioPath: string): string {
  return `${API_BASE}/${audioPath}`;
}
