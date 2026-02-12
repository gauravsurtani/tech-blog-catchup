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

export interface PlaylistTrack {
  post: Post;
  position: number;
}
