import { Page, Locator, expect } from "@playwright/test";

export class ExplorePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly sortDropdown: Locator;
  readonly postCards: Locator;
  readonly emptyState: Locator;
  readonly resultCount: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly filtersButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder("Search posts...");
    this.sortDropdown = page.locator("select");
    this.postCards = page.locator("[class*='bg-gray-900'][class*='border'][class*='rounded-xl']");
    this.emptyState = page.getByText("No posts found");
    this.resultCount = page.getByText(/showing \d+-\d+ of \d+ posts/i);
    this.prevButton = page.getByRole("button", { name: /prev/i });
    this.nextButton = page.getByRole("button", { name: /next/i });
    this.filtersButton = page.getByRole("button", { name: /filters/i });
  }

  async goto() {
    await this.page.goto("/explore");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(400);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(400);
  }

  async selectSort(value: string) {
    await this.sortDropdown.selectOption(value);
  }

  async expectPostCount(count: number) {
    await expect(this.postCards).toHaveCount(count);
  }

  async expectEmpty() {
    await expect(this.emptyState).toBeVisible();
  }

  getPostTitle(index: number) {
    return this.postCards.nth(index).locator("a").first();
  }
}
