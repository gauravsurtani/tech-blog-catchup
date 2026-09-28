import { test, expect } from "@playwright/test";

test("the hero is a seekable word-to-sound composition", async ({ page }) => {
  await page.goto("/");
  const film = page.locator(".word-sound");
  await expect(film).toBeVisible();
  await expect(film.locator("svg,canvas").first()).toBeVisible();
  await film.getByRole("button", { name: /Outline/i }).click();
  await expect(film.getByRole("button", { name: /Outline/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await film.getByRole("button", { name: /Conversation/i }).click();
  await expect(
    film.getByRole("button", { name: /Conversation/i }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page
      .locator("audio")
      .evaluate((audio: HTMLAudioElement) => audio.paused),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("reduced motion opens an informative still and manual chapters", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const film = page.locator(".word-sound");
  await expect(film).toBeVisible();
  await expect(film.getByRole("button", { name: /Pause/i })).toHaveCount(0);
  await film.getByRole("button", { name: /Episode/i }).click();
  await expect(film.getByRole("button", { name: /Episode/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("every reduced-motion chapter has a distinct rendered composition", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const film = page.locator(".word-sound");
  const { createHash } = await import("node:crypto");
  const hashes = new Set<string>();
  for (const chapter of ["Source", "Outline", "Conversation", "Episode"]) {
    await film.getByRole("button", { name: new RegExp(chapter, "i") }).click();
    const frame = await film
      .locator("svg,canvas")
      .first()
      .screenshot({
        path: `../../outputs/blog2podcast-${process.env.ART_VARIANT || "opus"}-${info.project.name.replaceAll(" ", "-")}-${chapter}.png`,
      });
    hashes.add(createHash("sha256").update(frame).digest("hex"));
  }
  expect(hashes.size).toBe(4);
});

test("pause freezes timeline and resume advances the rendered playhead", async ({
  page,
}) => {
  await page.goto("/");
  const film = page.locator(".word-sound");
  await film.scrollIntoViewIfNeeded();
  await film.getByRole("button", { name: "Pause", exact: true }).click();
  const slider = film.getByRole("slider", { name: "Animation position" });
  const time = await slider.inputValue();
  await page.waitForTimeout(500);
  expect(await slider.inputValue()).toBe(time);
  await film.getByRole("button", { name: "Play demo", exact: true }).click();
  await expect
    .poll(async () => Number(await slider.inputValue()))
    .toBeGreaterThan(Number(time));
});

test('Space activates the focused motion control without player shortcut interception',async({page})=>{
  await page.goto('/');
  const film=page.locator('.word-sound');
  await film.scrollIntoViewIfNeeded();
  const pause=film.getByRole('button',{name:'Pause',exact:true});
  await pause.focus();
  await pause.press('Space');
  await expect(film).toHaveAttribute('data-playing','false');
});
