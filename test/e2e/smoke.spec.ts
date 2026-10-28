import { chromium, expect, test, type Browser, type Page } from "@playwright/test";
import { join } from "node:path";
import { FIXTURE_DIR, TONES } from "./wav";

/** Launch Chromium with a WAV file as the microphone. */
async function withMic(file: string, fn: (page: Page) => Promise<void>, baseURL: string) {
  const browser: Browser = await chromium.launch({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${join(FIXTURE_DIR, file)}`,
    ],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(baseURL);
    await fn(page);
  } finally {
    await browser.close();
  }
}

test("start screen loads with both entry buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ukulele Tune" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start tuner" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tune by ear with reference tones" }),
  ).toBeVisible();
});

test("tones-only mode shows G C E A, plays a tone, opens settings and help", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tune by ear with reference tones" }).click();
  await expect(page.locator(".string-btn .letter")).toHaveText(["G", "C", "E", "A"]);
  await page.getByRole("button", { name: "Play G4 reference tone" }).click();
  await expect(page.locator(".tuner .status")).toHaveText("Playing G4 reference tone");
  await page.getByRole("button", { name: "Stop G4 reference tone" }).click();

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Increase A4" }).click();
  await page.getByLabel("Left-handed").check();
  await page.getByRole("button", { name: "Back to tuner" }).click();
  await expect(page.getByRole("button", { name: "A4 = 441" })).toBeVisible();
  await expect(page.locator(".string-btn .letter")).toHaveText(["A", "E", "C", "G"]);

  await page.getByRole("button", { name: "Help" }).click();
  await expect(page.getByRole("heading", { name: "High G or low G?" })).toBeVisible();
  await page.getByRole("button", { name: "Back to tuner" }).click();
  await expect(page.locator(".tuner")).toBeVisible();

  // Settings persist across reloads.
  await page.reload();
  await page.getByRole("button", { name: "Tune by ear with reference tones" }).click();
  await expect(page.getByRole("button", { name: "A4 = 441" })).toBeVisible();
});

test("microphone: G4 reads in tune", async ({ baseURL }) => {
  await withMic(
    TONES.g4.file,
    async (page) => {
      await page.getByRole("button", { name: "Start tuner" }).click();
      await expect(page.locator(".note-label")).toHaveText("G4", { timeout: 5000 });
      await expect(page.locator(".pill")).toHaveText("In tune");
      await expect(page.locator(".string-btn.is-current .letter")).toHaveText("G");
    },
    baseURL ?? "",
  );
});

test("microphone: E locked and 23 cents flat says tighten", async ({ baseURL }) => {
  await withMic(
    TONES.e4flat.file,
    async (page) => {
      await page.getByRole("button", { name: "Start tuner" }).click();
      await page.getByRole("button", { name: /^E ?4 ·/ }).click();
      await expect(page.locator(".lock-note")).toHaveText("Locked: E · tap Auto to unlock");
      await expect(page.locator(".pill")).toHaveText("Tighten", { timeout: 5000 });
      await expect(page.locator(".note-cents")).toHaveText(/^−2[2-4] ¢$/);
    },
    baseURL ?? "",
  );
});

test("microphone: low G on a high-G tuning warns and can switch", async ({ baseURL }) => {
  await withMic(
    TONES.g3.file,
    async (page) => {
      await page.getByRole("button", { name: "Start tuner" }).click();
      const card = page.locator(".octave-card");
      await expect(card).toContainText("Sounds an octave low.", { timeout: 5000 });
      await card.getByRole("button", { name: "Switch to Standard C (low G)" }).click();
      await expect(page.locator("#tuning")).toHaveValue("c-low-g");
      await expect(page.locator(".note-label")).toHaveText("G3", { timeout: 5000 });
      await expect(page.locator(".pill")).toHaveText("In tune");
    },
    baseURL ?? "",
  );
});
