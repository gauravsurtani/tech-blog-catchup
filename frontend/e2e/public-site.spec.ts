import { test, expect } from "@playwright/test";
test("homepage explains access and walkthrough responds to controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good ideas deserve a little airtime." }),
  ).toBeVisible();
  await expect(
    page.getByText("Illustrative demo, no live generation"),
  ).toBeVisible();
  await page.getByRole("button", { name: "2 Outline", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Keep the ideas that matter." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play demo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play demo", exact: true }),
  ).toBeVisible();
  await page.locator(".motion-outline").evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
  await page.screenshot({
    path: `../../outputs/blog2podcast-${test.info().project.name.replaceAll(" ", "-")}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("reduced motion uses a manual stepper", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Keep the ideas that matter." }),
  ).toBeVisible();
});
test("login unavailable state preserves public access", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "A little room for learning." }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Member sign-in is being configured. The public library is open.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Browse the library", exact: true }),
  ).toHaveAttribute("href", "/listen");
});
test("gateway rejects anonymous and cross-origin mutation", async ({
  request,
}) => {
  expect((await request.get("/api/backend/jobs")).status()).toBe(401);
  expect(
    (
      await request.post("/api/backend/generate", {
        data: { post_id: 1 },
        headers: { Origin: "https://other.example" },
      })
    ).status(),
  ).toBe(403);
  expect((await request.get("/api/backend/import")).status()).toBe(404);
});
test("unknown episode returns real 404", async ({ request }) => {
  expect((await request.get("/post/999999999")).status()).toBe(404);
});

test('public generation action routes anonymous readers to sign-in',async({page})=>{
  test.skip(process.env.BETA_FIXTURE !== 'true', 'Requires candidate fixture');
  await page.goto('/explore');
  // This acceptance case uses the controlled candidate backend fixture.
  const card=page.getByRole('heading',{name:'A draftable public source'});
  await expect(card).toBeVisible();
  await page.getByRole('button',{name:'Create private draft',exact:true}).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading',{name:'A little room for learning.'})).toBeVisible();
});

test('desktop article playback button is not covered by navigation',async({page})=>{
  test.skip(process.env.BETA_FIXTURE !== 'true','Requires candidate fixture');
  await page.goto('/post/1');
  await page.getByRole('button',{name:'Play Podcast',exact:true}).click();
  await expect.poll(()=>page.locator('audio').evaluate((audio:HTMLAudioElement)=>audio.paused)).toBe(false);
});

test('homepage shares app theme and motion can be stopped',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  const sourceBounds = await page.locator('.motion-source').boundingBox();
  const captionBounds = await page.locator('.stage-footnote').boundingBox();
  expect(sourceBounds!.y + sourceBounds!.height + 5).toBeLessThan(captionBounds!.y);
  const selected=await page.locator('[aria-label="Walkthrough steps"] [aria-pressed="true"]').textContent();
  await expect(page.locator('.story-stage')).not.toHaveClass(/is-playing/);
  await page.waitForTimeout(4500);
  expect(await page.locator('[aria-label="Walkthrough steps"] [aria-pressed="true"]').textContent()).toBe(selected);
  expect(await page.locator('audio').evaluate((a:HTMLAudioElement)=>a.paused)).toBe(true);
  const dark=await page.locator('.site').evaluate(el=>({site:getComputedStyle(el).backgroundColor,body:getComputedStyle(document.body).backgroundColor}));
  expect(dark.site).toBe(dark.body);
  await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
  await expect(page.getByRole('button',{name:'Switch to dark theme',exact:true})).toBeVisible();
  await expect.poll(()=>page.locator('.site').evaluate(el=>getComputedStyle(el).backgroundColor===getComputedStyle(document.body).backgroundColor)).toBe(true);
  const light=await page.locator('.site').evaluate(el=>({site:getComputedStyle(el).backgroundColor,body:getComputedStyle(document.body).backgroundColor}));
  expect(light.site).toBe(light.body);expect(light.site).not.toBe(dark.site);
  await page.screenshot({path:`../../outputs/blog2podcast-motion-light-${test.info().project.name.replaceAll(' ','-')}.png`,fullPage:true});
});
