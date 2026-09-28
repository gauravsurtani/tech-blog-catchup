import { notFound } from "next/navigation";
import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE_URL = "https://blog2podcast.com";

interface PostResponse {
  id: number;
  title: string;
  summary: string | null;
  source_name: string;
  author: string | null;
  published_at: string | null;
}

async function fetchPost(id: string): Promise<PostResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/posts/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchPost(id);

  if (!post) {
    return { title: "Post not found" };
  }

  const description =
    post.summary || `Listen to ${post.title} as a conversational podcast`;

  return {
    title: post.title,
    description,
    openGraph: {
      type: "article",
      siteName: "Blog2Podcast",
      title: post.title,
      description,
      url: `${SITE_URL}/post/${post.id}`,
      ...(post.published_at && { publishedTime: post.published_at }),
      ...(post.author && { authors: [post.author] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default async function PostLayout({ children, params }: {children: React.ReactNode;params: Promise<{id:string}>}) {
  const {id}=await params;
  if(!/^\d+$/.test(id)||!await fetchPost(id)) notFound();
  return children;
}
