import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { PostDetailPage } from "./pages/PostDetailPage";
import {
  mockApi,
  fakePost,
  fakePaginatedPosts,
  fakePostDetail,
} from "./utils/test-helpers";

test.describe("Home page", () => {
  test("loads and shows post grid", async ({ page }) => {
    const posts = Array.from({ length: 3 }, (_, i) =>
      fakePost({ id: i + 1, title: `Post ${i + 1}` })
    );
    await mockApi(page, { posts: fakePaginatedPosts(posts) });

    const home = new HomePage(page);
    await home.goto();
    await home.expectLoaded();
    await home.expectPostCount(3);
  });

  test("shows empty state when no posts", async ({ page }) => {
    await mockApi(page, { posts: fakePaginatedPosts([], 0) });

    const home = new HomePage(page);
    await home.goto();
    await home.expectLoaded();
    await home.expectEmpty();
  });

  test("shows error state on API failure", async ({ page }) => {
    await page.route("**/api/posts?*", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "Server error" }) })
    );

    const home = new HomePage(page);
    await home.goto();
    await expect(home.errorMessage).toBeVisible();
  });
});

test.describe("Explore page", () => {
  test("loads with search bar and post grid", async ({ page }) => {
    const posts = Array.from({ length: 2 }, (_, i) =>
      fakePost({ id: i + 1, title: `Explore Post ${i + 1}` })
    );
    await mockApi(page, { posts: fakePaginatedPosts(posts) });

    const explore = new ExplorePage(page);
    await explore.goto();
    await expect(explore.searchInput).toBeVisible();
    await explore.expectPostCount(2);
  });

  test("search filters posts", async ({ page }) => {
    const allPosts = [
      fakePost({ id: 1, title: "Kubernetes Guide" }),
      fakePost({ id: 2, title: "React Hooks" }),
    ];
    await mockApi(page, { posts: fakePaginatedPosts(allPosts) });

    // Override the route for search query
    await page.route("**/api/posts?*search=kubernetes*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fakePaginatedPosts([allPosts[0]])),
      })
    );

    const explore = new ExplorePage(page);
    await explore.goto();
    await explore.search("kubernetes");
    await explore.expectPostCount(1);
  });

  test("empty state when no results match", async ({ page }) => {
    await mockApi(page, { posts: fakePaginatedPosts([], 0) });

    const explore = new ExplorePage(page);
    await explore.goto();
    await explore.expectEmpty();
  });

  test("sort dropdown changes order", async ({ page }) => {
    await mockApi(page);

    const explore = new ExplorePage(page);
    await explore.goto();
    await expect(explore.sortDropdown).toBeVisible();
    await explore.selectSort("oldest");
    // Sort change triggers new API call — just verify dropdown value changed
    await expect(explore.sortDropdown).toHaveValue("oldest");
  });
});

test.describe("Post detail page", () => {
  test("shows post content", async ({ page }) => {
    const detail = fakePostDetail({
      id: 42,
      title: "Deep Dive Into Containers",
      full_text: "Containers are lightweight OS-level virtualization.",
    });
    await mockApi(page, { postDetail: detail });

    const postPage = new PostDetailPage(page);
    await postPage.goto(42);
    await postPage.expectLoaded("Deep Dive Into Containers");
    await postPage.expectFullText("Containers are lightweight");
  });

  test("back link navigates to explore", async ({ page }) => {
    await mockApi(page);

    const postPage = new PostDetailPage(page);
    await postPage.goto(1);
    await expect(postPage.backLink).toBeVisible();
    await expect(postPage.backLink).toHaveAttribute("href", "/explore");
  });

  test("shows 404 for nonexistent post", async ({ page }) => {
    await page.route("**/api/posts/9999", (route) =>
      route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "Post not found" }) })
    );

    const postPage = new PostDetailPage(page);
    await postPage.goto(9999);
    await postPage.expectNotFound();
  });

  test("play and queue buttons visible for ready audio", async ({ page }) => {
    await mockApi(page, {
      postDetail: fakePostDetail({ audio_status: "ready" }),
    });

    const postPage = new PostDetailPage(page);
    await postPage.goto(1);
    await expect(postPage.playButton).toBeVisible();
    await expect(postPage.addToQueueButton).toBeVisible();
  });
});
