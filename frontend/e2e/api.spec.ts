import { test, expect } from "@playwright/test";

const API_BASE = process.env.PLAYWRIGHT_API_URL || "http://localhost:8000";

test.describe("API integration", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body).toHaveProperty("uptime_seconds");
    expect(body).toHaveProperty("db_connected");
    expect(body).toHaveProperty("version");
  });

  test("posts endpoint returns paginated data", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/posts?limit=5&offset=0`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("posts");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("offset");
    expect(body).toHaveProperty("limit");
    expect(Array.isArray(body.posts)).toBeTruthy();
  });

  test("tags endpoint returns array", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/tags`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test("sources endpoint returns array", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/sources`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test("status endpoint returns summary", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/status`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("total_posts");
    expect(body).toHaveProperty("posts_by_source");
    expect(body).toHaveProperty("audio_counts");
    expect(body).toHaveProperty("tag_counts");
  });

  test("nonexistent post returns 404", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/posts/999999`);
    expect(res.status()).toBe(404);
  });

  test("jobs endpoint returns array", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/jobs`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });
});
