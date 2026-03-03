import type { PaginatedPosts, PostDetail, Tag, Source, CrawlStatusItem, Job } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

export class ApiError extends Error {
  status: number;
  details: string | null;

  constructor(status: number, message: string, details: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseErrorBody(res: Response): Promise<string | null> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
    if (typeof body.error === "string") return body.error;
  } catch {
    // response body is not JSON or empty
  }
  return null;
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        return res.json();
      }

      const detail = await parseErrorBody(res);
      const message = detail || `${res.status} ${res.statusText}`;

      if (isRetryable(res.status) && attempt < MAX_RETRIES - 1) {
        lastError = new ApiError(res.status, message, detail);
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }

      throw new ApiError(res.status, message, detail);
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      // Network error or abort
      const isTimeout =
        err instanceof DOMException && err.name === "AbortError";
      const networkMessage = isTimeout
        ? "Request timed out"
        : "Network error";

      lastError = new ApiError(0, networkMessage, null);

      if (attempt < MAX_RETRIES - 1) {
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new ApiError(0, "Request failed after retries", null);
}

export interface PostsParams {
  source?: string;
  tag?: string;
  search?: string;
  audio_status?: string;
  offset?: number;
  limit?: number;
  sort?: string;
  ids?: number[];
}

export function getPosts(params: PostsParams = {}): Promise<PaginatedPosts> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(","));
      } else {
        searchParams.set(key, String(value));
      }
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

export function triggerCrawl(source?: string) {
  return fetchAPI("/api/crawl", {
    method: "POST",
    body: JSON.stringify({ source }),
  });
}

export function triggerGenerate(postId?: number, limit: number = 10) {
  return fetchAPI("/api/generate", {
    method: "POST",
    body: JSON.stringify({ post_id: postId, limit }),
  });
}

export function getCrawlStatus(): Promise<CrawlStatusItem[]> {
  return fetchAPI<CrawlStatusItem[]>("/api/crawl-status");
}

export function getJobs(params: { job_type?: string; status?: string } = {}): Promise<Job[]> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return fetchAPI<Job[]>(`/api/jobs${qs ? `?${qs}` : ""}`);
}

export function getAudioUrl(audioPath: string): string {
  return `${API_BASE}/${audioPath}`;
}
