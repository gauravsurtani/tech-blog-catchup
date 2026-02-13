import { Page, Locator, expect } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly postGrid: Locator;
  readonly postCards: Locator;
  readonly loadMoreButton: Locator;
  readonly emptyState: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Latest Episodes" });
    this.postGrid = page.locator(".grid");
    this.postCards = page.locator("[class*='bg-gray-900'][class*='border'][class*='rounded-xl']");
    this.loadMoreButton = page.getByRole("button", { name: /load more/i });
    this.emptyState = page.getByText("No episodes yet");
    this.errorMessage = page.getByText(/failed to load posts/i);
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async expectPostCount(count: number) {
    await expect(this.postCards).toHaveCount(count);
  }

  async expectEmpty() {
    await expect(this.emptyState).toBeVisible();
  }

  getPlayButton(index: number) {
    return this.postCards.nth(index).getByRole("button", { name: /play/i });
  }

  getAddToQueueButton(index: number) {
    return this.postCards.nth(index).getByRole("button", { name: /add to queue/i });
  }
}
