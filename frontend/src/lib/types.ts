export interface Post {
  id: number;
  url: string;
  source_key: string;
  source_name: string;
  title: string;
  summary: string | null;
  author: string | null;
  published_at: string | null;
  tags: string[];
  audio_status: "pending" | "processing" | "ready" | "failed";
  audio_path: string | null;
  audio_duration_secs: number | null;
  word_count: number | null;
}

export interface PostDetail extends Post {
  full_text: string | null;
  crawled_at: string;
}

export interface Tag {
  name: string;
  slug: string;
  post_count: number;
}

export interface Source {
  key: string;
  name: string;
  post_count: number;
}

export interface PaginatedPosts {
  posts: Post[];
  total: number;
  offset: number;
  limit: number;
}

export interface StatusInfo {
  total_posts: number;
  posts_by_source: Source[];
  audio_counts: Record<string, number>;
  tag_counts: Tag[];
}

export interface Job {
  id: number;
  job_type: string;
  status: string;
  params: string | null;
  result: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface CrawlStatusItem {
  source_key: string;
  source_name: string;
  enabled: boolean;
  feed_url: string;
  blog_url: string | null;
  status: "success" | "error" | "running" | "never";
  post_count: number;
  total_discoverable: number | null;
  last_crawl_at: string | null;
  last_crawl_type: string | null;
  posts_added_last: number | null;
  urls_found_last: number | null;
  error_message: string | null;
}
