import { test, expect } from "@playwright/test";

test.describe("Mobile Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
  });

  test("bottom tabs visible on mobile, hidden on desktop", async ({ page, isMobile }) => {
    const bottomTabs = page.locator('nav[aria-label="Mobile navigation"]');
    if (isMobile) {
      await expect(bottomTabs).toBeVisible();
    } else {
      await expect(bottomTabs).toBeHidden();
    }
  });

  test("sidebar visible on desktop, hidden on mobile", async ({ page, isMobile }) => {
    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    if (isMobile) {
      await expect(sidebar).toBeHidden();
    } else {
      // Sidebar is a client component, wait for hydration
      await expect(sidebar).toBeVisible({ timeout: 10000 });
    }
  });

  test("no horizontal overflow on mobile", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("touch targets meet 44px minimum", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    const tabLinks = page.locator('nav[aria-label="Mobile navigation"] a');
    const count = await tabLinks.count();
    for (let i = 0; i < count; i++) {
      const box = await tabLinks.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("main content not clipped by fixed elements", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    const main = page.locator("#main-content");
    const mainBox = await main.boundingBox();
    expect(mainBox).not.toBeNull();
    if (mainBox) {
      expect(mainBox.y).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe("Mobile Navigation", () => {
  test("bottom tabs navigate to correct pages", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    await page.goto("/");
    await page.waitForLoadState("load");

    await page.locator('nav[aria-label="Mobile navigation"] a[href="/explore"]').click();
    await expect(page).toHaveURL(/\/explore/);

    await page.locator('nav[aria-label="Mobile navigation"] a[href="/library"]').click();
    await expect(page).toHaveURL(/\/library/);
  });
});

test.describe("Search Dialog Mobile", () => {
  test("search dialog is usable on mobile viewport", async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    await page.goto("/");

    await page.keyboard.press("Meta+k");
    const dialog = page.locator('div[role="dialog"][aria-label="Search"]');
    await expect(dialog).toBeVisible();

    const input = dialog.locator("input");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    const dialogBox = await dialog.locator(".relative.w-full").boundingBox();
    if (dialogBox) {
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(dialogBox.width).toBeLessThanOrEqual(viewportWidth);
    }
  });
});
