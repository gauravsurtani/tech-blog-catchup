import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import {
  mockApi,
  fakePost,
  fakePaginatedPosts,
} from "./utils/test-helpers";

test.describe("Audio player", () => {
  test.beforeEach(async ({ page }) => {
    const posts = [
      fakePost({ id: 1, title: "Track One", audio_status: "ready" }),
      fakePost({ id: 2, title: "Track Two", audio_status: "ready" }),
    ];
    await mockApi(page, { posts: fakePaginatedPosts(posts) });

    // Mock audio file to prevent network errors
    await page.route("**/audio/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "audio/mpeg",
        body: Buffer.alloc(1024),
      })
    );
  });

  test("clicking play shows player bar", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.expectPostCount(2);

    // Player should not be visible initially
    const playerBar = page.locator(".fixed.bottom-0");
    await expect(playerBar).not.toBeVisible();

    // Click play on first post
    await home.getPlayButton(0).click();

    // Player bar should appear
    await expect(playerBar).toBeVisible();
    await expect(playerBar.getByText("Track One")).toBeVisible();
  });

  test("play/pause toggle works", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.getPlayButton(0).click();

    const playerBar = page.locator(".fixed.bottom-0");
    const pauseButton = playerBar.getByRole("button", { name: /pause/i });
    const playButton = playerBar.getByRole("button", { name: /play/i });

    // Should be playing (pause button visible)
    await expect(pauseButton).toBeVisible();

    // Click pause
    await pauseButton.click();
    await expect(playButton).toBeVisible();

    // Click play again
    await playButton.click();
    await expect(pauseButton).toBeVisible();
  });

  test("add to queue updates badge", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    // First play a track to show the player bar
    await home.getPlayButton(0).click();

    // Add second track to queue
    await home.getAddToQueueButton(1).click();

    // Queue badge should show count
    const queueButton = page.getByRole("button", { name: /toggle queue/i });
    await expect(queueButton.locator("span")).toContainText("1");
  });

  test("queue panel opens and shows tracks", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    // Play first, add second to queue
    await home.getPlayButton(0).click();
    await home.getAddToQueueButton(1).click();

    // Open queue panel
    const queueButton = page.getByRole("button", { name: /toggle queue/i });
    await queueButton.click();

    // Queue panel should be visible with the queued track
    await expect(page.getByText("Track Two")).toBeVisible();
  });

  test("speed control cycles through values", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.getPlayButton(0).click();

    const speedButton = page.getByRole("button", { name: /playback speed/i });
    await expect(speedButton).toContainText("1x");

    // Click to cycle
    await speedButton.click();
    await expect(speedButton).toContainText("1.25x");

    await speedButton.click();
    await expect(speedButton).toContainText("1.5x");
  });
});
