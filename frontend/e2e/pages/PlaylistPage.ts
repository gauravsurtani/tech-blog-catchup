import { Page, Locator, expect } from "@playwright/test";

export class PlaylistPage {
  readonly page: Page;
  readonly postCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.postCards = page.locator("[class*='bg-gray-900'][class*='border'][class*='rounded-xl']");
    this.emptyState = page.getByText(/no posts/i);
  }

  async goto() {
    await this.page.goto("/playlist");
  }

  async expectPostCount(count: number) {
    await expect(this.postCards).toHaveCount(count);
  }
}
