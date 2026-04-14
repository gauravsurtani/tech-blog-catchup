import { test, expect } from "@playwright/test";

test.describe("PWA Configuration", () => {
  test("manifest.json is valid and accessible", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe("Catchup");
    expect(manifest.short_name).toBe("Catchup");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.id).toBe("/");
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();

    const iconSizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(iconSizes).toContain("192x192");
    expect(iconSizes).toContain("512x512");

    const maskable = manifest.icons.find((i: { purpose?: string }) => i.purpose === "maskable");
    expect(maskable).toBeTruthy();
  });

  test("service worker script is served", async ({ request }) => {
    // SW file exists in public/ but no auto-registration code yet.
    // Verify the script is fetchable so browsers can register it.
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("self.addEventListener");
  });

  test("apple PWA meta tags are present", async ({ page }) => {
    await page.goto("/");

    // Next.js 16 renders apple-mobile-web-app-title and status-bar-style
    // (not apple-mobile-web-app-capable) when appleWebApp metadata is set
    const appTitle = page.locator('meta[name="apple-mobile-web-app-title"]');
    await expect(appTitle).toHaveAttribute("content", "Catchup");

    const statusBar = page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').first();
    await expect(statusBar).toHaveAttribute("content", "black-translucent");

    const themeColor = page.locator('meta[name="theme-color"]').first();
    await expect(themeColor).toHaveAttribute("content");

    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute("content");
    expect(content).toContain("viewport-fit=cover");
  });

  test("manifest link is in head", async ({ page }) => {
    await page.goto("/");
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");
  });
});
