import { chromium, expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { FIXTURE_DIR, TONES } from "./wav";

const STANDALONE = join(FIXTURE_DIR, "../../dist/standalone.html");

test("standalone.html opens from disk and tunes", async () => {
  expect(existsSync(STANDALONE)).toBe(true);
  const browser = await chromium.launch({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${join(FIXTURE_DIR, TONES.g4.file)}`,
    ],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto(pathToFileURL(STANDALONE).href);
    await page.getByRole("button", { name: "Start tuner" }).click();
    await expect(page.locator(".note-label")).toHaveText("G4", { timeout: 5000 });
    await expect(page.locator(".pill")).toHaveText("In tune");
    expect(errors).toEqual([]);
    // Everything is inlined: the only request is the page itself.
    expect(requests.filter((u) => !u.startsWith("file:") && !u.startsWith("data:"))).toEqual([]);
    expect(await page.evaluate(() => navigator.serviceWorker?.controller ?? null)).toBeNull();
  } finally {
    await browser.close();
  }
});
