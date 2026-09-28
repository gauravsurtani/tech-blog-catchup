import { test, expect } from '@playwright/test';

test('public session discovery stays anonymous when OAuth is unavailable', async ({ page, request }) => {
  await page.goto('/login');
  await expect(page.getByRole('status')).toContainText('Member sign-in is being configured');
  const session = await request.get('/api/auth/session');
  expect(session.status()).toBe(200);
  expect(await session.json()).toBeNull();
  const providers = await request.get('/api/auth/providers');
  expect(await providers.json()).toEqual({});
  const signIn = await request.post('/api/auth/signin');
  expect(signIn.status()).toBe(503);
});

 test('Mac library shortcut hydrates without a server-client mismatch', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' }));
  await page.goto('/listen');
  await expect(page.getByRole('heading', {name:'Your Podcast Feed'})).toBeVisible();
  await expect(page.locator('kbd').first()).toHaveText('⌘K');
  expect(errors.filter(error => /hydration|hydrating|#418/i.test(error))).toEqual([]);
});
