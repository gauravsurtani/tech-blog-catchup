import { test, expect } from '@playwright/test';

test('lower-page cards reveal in scroll order and footer is reachable', async ({ page }, info) => {
  await page.goto('/');
  const cards = page.locator('[data-scroll-card]');
  await expect(cards).toHaveCount(3);
  const wave = page.locator('.footer-signoff svg path');
  await expect.poll(() => wave.evaluate(el => getComputedStyle(el).strokeDashoffset)).toMatch(/^(?:calc\()?1(?:px)?\)?$/);
  await expect.poll(() => cards.last().evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(0.5);
  for (let index = 0; index < 3; index++) {
    const card = cards.nth(index);
    await card.evaluate(el => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - innerHeight * 0.25));
    await expect.poll(() => card.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.98);
    if (index < 2) {
      await expect.poll(() => cards.nth(index + 1).evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(0.95);
    }
    await page.screenshot({ path: `../../outputs/blog2podcast-scroll-${info.project.name.replaceAll(' ', '-')}-card-${index + 1}.png` });
  }
  const footer = page.locator('[data-home-footer]');
  await footer.getByRole('link', { name: 'Privacy', exact: true }).scrollIntoViewIfNeeded();
  await expect.poll(() => wave.evaluate(el => getComputedStyle(el).strokeDashoffset)).toMatch(/^(?:calc\()?0(?:px|%)?\)?$/);
  await expect(footer.getByRole('link', { name: 'Privacy', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `../../outputs/blog2podcast-scroll-${info.project.name.replaceAll(' ', '-')}-footer.png` });
});

test('reduced motion keeps all lower-page content visible before scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const item of await page.locator('[data-scroll-card], [data-scroll-note], .footer-signoff').all()) {
    await expect(item).toHaveCSS('opacity', '1');
    await expect(item).toHaveCSS('transform', 'none');
  }
});

test('lower-page content remains readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  for (const item of await page.locator('[data-scroll-card], [data-scroll-note], .footer-signoff').all()) {
    await expect(item).toHaveCSS('opacity', '1');
  }
  await expect(page.getByRole('link', { name: 'Find your next listen' })).toHaveAttribute('href', '/listen');
  await context.close();
});
