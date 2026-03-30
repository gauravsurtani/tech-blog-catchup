import { test, expect } from "@playwright/test";

// Our CSS breakpoint for mobile/desktop is md:768px
const MD_BREAKPOINT = 768;

test.describe("Mobile Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
  });

  test("bottom tabs visible on mobile, hidden on desktop", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 1280;
    const bottomTabs = page.locator('nav[aria-label="Mobile navigation"]');
    if (width < MD_BREAKPOINT) {
      await expect(bottomTabs).toBeVisible();
    } else {
      await expect(bottomTabs).toBeHidden();
    }
  });

  test("sidebar visible on desktop, hidden on mobile", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 1280;
    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    if (width < MD_BREAKPOINT) {
      await expect(sidebar).toBeHidden();
    } else {
      await expect(sidebar).toBeVisible({ timeout: 10000 });
    }
  });

  test("no horizontal overflow on mobile", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 1280;
    if (width >= MD_BREAKPOINT) {
      test.skip();
      return;
    }
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("touch targets meet 44px minimum on mobile", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 1280;
    if (width >= MD_BREAKPOINT) {
      test.skip();
      return;
    }
    // Wait for bottom tabs to render
    const bottomTabs = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(bottomTabs).toBeVisible({ timeout: 10000 });

    const tabLinks = bottomTabs.locator("a");
    const count = await tabLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await tabLinks.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("main content not clipped by fixed elements", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 1280;
    if (width >= MD_BREAKPOINT) {
      test.skip();
      return;
    }
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10000 });
    const mainBox = await main.boundingBox();
    expect(mainBox).not.toBeNull();
    if (mainBox) {
      expect(mainBox.y).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe("Mobile Navigation", () => {
  test("bottom tabs navigate to correct pages", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 1280;
    if (width >= MD_BREAKPOINT) {
      test.skip();
      return;
    }
    await page.goto("/");
    await page.waitForLoadState("load");

    const nav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(nav).toBeVisible({ timeout: 10000 });

    await nav.locator('a[href="/explore"]').click();
    await expect(page).toHaveURL(/\/explore/);

    await nav.locator('a[href="/library"]').click();
    await expect(page).toHaveURL(/\/library/);
  });
});

test.describe("Search Dialog", () => {
  test("search dialog opens and is usable on desktop", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 1280;
    if (width < MD_BREAKPOINT) {
      test.skip();
      return;
    }
    await page.goto("/");
    await page.waitForLoadState("load");

    // Cmd+K / Ctrl+K opens search on desktop
    await page.keyboard.press("Meta+k");
    const dialog = page.locator('div[role="dialog"][aria-label="Search"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const input = dialog.locator("input");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
