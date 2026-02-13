import { Page, Route } from "@playwright/test";

/** Fake post data matching the backend PostSummary schema. */
export function fakePost(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    url: "https://example.com/test-post",
    source_key: "test",
    source_name: "Test Blog",
    title: "Test Post Title",
    summary: "A short summary of the test post for display.",
    author: "Test Author",
    published_at: "2025-01-15T10:00:00Z",
    tags: ["Infrastructure", "DevOps"],
    audio_status: "ready",
    audio_duration_secs: 300,
    word_count: 2500,
    ...overrides,
  };
}

/** Fake full post detail matching PostDetail schema. */
export function fakePostDetail(overrides: Record<string, unknown> = {}) {
  return {
    ...fakePost(overrides),
    full_text: "This is the full article text for testing purposes.",
    audio_path: "audio/test-post.mp3",
    crawled_at: "2025-01-15T12:00:00Z",
  };
}

/** Fake paginated response. */
export function fakePaginatedPosts(
  posts: ReturnType<typeof fakePost>[] = [fakePost()],
  total?: number
) {
  return {
    posts,
    total: total ?? posts.length,
    offset: 0,
    limit: 20,
  };
}

/** Mock the backend API at /api/* for a given page. */
export async function mockApi(
  page: Page,
  overrides: {
    posts?: ReturnType<typeof fakePaginatedPosts>;
    tags?: { name: string; slug: string; post_count: number }[];
    sources?: { key: string; name: string; post_count: number }[];
    health?: Record<string, unknown>;
    postDetail?: ReturnType<typeof fakePostDetail>;
  } = {}
) {
  const posts = overrides.posts ?? fakePaginatedPosts();
  const tags = overrides.tags ?? [
    { name: "Infrastructure", slug: "infrastructure", post_count: 5 },
    { name: "AI/ML", slug: "ai-ml", post_count: 3 },
  ];
  const sources = overrides.sources ?? [
    { key: "test", name: "Test Blog", post_count: 10 },
  ];
  const health = overrides.health ?? {
    status: "ok",
    uptime_seconds: 120,
    db_connected: true,
    total_posts: posts.total,
    audio_ready_count: 1,
    version: "0.1.0",
  };

  await page.route("**/api/posts?*", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(posts) })
  );

  await page.route("**/api/posts/*", (route: Route) => {
    const url = route.request().url();
    const match = url.match(/\/api\/posts\/(\d+)/);
    if (match) {
      const detail = overrides.postDetail ?? fakePostDetail({ id: Number(match[1]) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detail) });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "Not found" }) });
  });

  await page.route("**/api/tags", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tags) })
  );

  await page.route("**/api/sources", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sources) })
  );

  await page.route("**/api/health", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(health) })
  );

  await page.route("**/api/status", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total_posts: posts.total,
        posts_by_source: sources.map((s) => ({ ...s })),
        audio_counts: { ready: 1, pending: 0 },
        tag_counts: tags.map((t) => ({ ...t })),
      }),
    })
  );
}
