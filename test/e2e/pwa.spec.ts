import { expect, test } from "@playwright/test";

test("manifest is linked and valid", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const res = await request.get(new URL(href ?? "", page.url()).href);
  const manifest = await res.json();
  expect(manifest.name).toBe("Ukulele Tune");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toContain("512x512");
});

test("works offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Reload once so the page is controlled by the service worker.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "Start tuner" })).toBeVisible();
  await page.getByRole("button", { name: "Tune by ear with reference tones" }).click();
  await expect(page.locator(".string-btn .letter")).toHaveText(["G", "C", "E", "A"]);
  // The bundled font is served from the cache too.
  await expect
    .poll(() => page.evaluate(() => document.fonts.check('16px "Inter Variable"')))
    .toBe(true);
  await context.setOffline(false);
});
