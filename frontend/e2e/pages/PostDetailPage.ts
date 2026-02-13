import { Page, Locator, expect } from "@playwright/test";

export class PostDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly backLink: Locator;
  readonly sourceName: Locator;
  readonly playButton: Locator;
  readonly addToQueueButton: Locator;
  readonly fullText: Locator;
  readonly originalLink: Locator;
  readonly notFound: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator("h1");
    this.backLink = page.getByRole("link", { name: /back to explore/i });
    this.sourceName = page.locator(".uppercase.tracking-wide").first();
    this.playButton = page.getByRole("button", { name: /play podcast/i });
    this.addToQueueButton = page.getByRole("button", { name: /add to queue/i });
    this.fullText = page.locator("pre");
    this.originalLink = page.getByRole("link", { name: /read the original/i });
    this.notFound = page.getByText("Post not found");
  }

  async goto(postId: number) {
    await this.page.goto(`/post/${postId}`);
  }

  async expectLoaded(title: string) {
    await expect(this.title).toContainText(title);
  }

  async expectNotFound() {
    await expect(this.notFound).toBeVisible();
  }

  async expectFullText(text: string) {
    await expect(this.fullText).toContainText(text);
  }
}
