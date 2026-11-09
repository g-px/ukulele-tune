import { chromium, expect, test, type Browser, type Page } from "@playwright/test";
import { join } from "node:path";
import { FIXTURE_DIR, SEQUENCES, TONES } from "./wav";

test("first launch offers the setup; 'I know my tuning' skips it for good", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Set up my ukulele/ })).toBeVisible();
  await page.getByRole("button", { name: "Tune by ear with reference tones" }).click();
  await expect(page.locator(".tuner")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Start tuner", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New to the ukulele? Set up my ukulele" }),
  ).toBeVisible();
});

test("walks hold → size → look, and baritone skips the look step", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Set up my ukulele/ }).click();
  await expect(page.getByRole("heading", { name: "Hold it like this" })).toBeVisible();
  await expect(page.getByText("Step 1 of 4")).toBeVisible();

  await page.getByLabel("I play left-handed").check();
  await expect(page.getByText("Neck to your right, strings facing out.")).toBeVisible();
  await page.getByLabel("I play left-handed").uncheck();

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "How big is it?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await page.getByRole("button", { name: /^Concert/ }).click();
  await expect(page.getByRole("button", { name: /^Concert/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Look at string 4" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();

  await page.getByRole("button", { name: /^Baritone/ }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Let the app listen" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "How big is it?" })).toBeVisible();
});

test("Skip leaves the wizard and counts as onboarded", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Set up my ukulele/ }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("button", { name: "Start tuner", exact: true })).toBeVisible();
});

test("the setup opens from Settings and Help", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tune by ear with reference tones" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Not sure? Find my ukulele" }).click();
  await expect(page.getByRole("heading", { name: "Hold it like this" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Back to tuner" }).click();
  await page.getByRole("button", { name: "Help" }).click();
  await page.getByRole("button", { name: "Set up my ukulele" }).click();
  await expect(page.getByRole("heading", { name: "Hold it like this" })).toBeVisible();
});

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

async function toListenStep(page: Page, size: RegExp, look: RegExp | null) {
  await page.getByRole("button", { name: /Set up my ukulele/ }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: size }).click();
  await page.getByRole("button", { name: "Next" }).click();
  if (look) {
    await page.getByRole("button", { name: look }).click();
    await page.getByRole("button", { name: "Next" }).click();
  }
  await page.getByRole("button", { name: "Start listening" }).click();
}

test("the listen step hears string 4 then string 3 (high G)", async ({ baseURL }) => {
  await withMic(
    SEQUENCES.highG.file,
    async (page) => {
      await toListenStep(page, /^Concert/, /^Thinner/);
      const slots = page.locator(".slot");
      await expect(slots.nth(0)).toHaveClass(/done/, { timeout: 8000 });
      await expect(slots.nth(0).locator(".slot-note")).toContainText("G4");
      await expect(slots.nth(1)).toHaveClass(/done/, { timeout: 8000 });
      await expect(slots.nth(1).locator(".slot-note")).toContainText("C4");
      await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
    },
    baseURL ?? "",
  );
});

test("the listen step hears a low G", async ({ baseURL }) => {
  await withMic(
    SEQUENCES.lowG.file,
    async (page) => {
      await toListenStep(page, /^Not sure/, /^Can't tell/);
      const slots = page.locator(".slot");
      await expect(slots.nth(1)).toHaveClass(/done/, { timeout: 8000 });
      await expect(slots.nth(0).locator(".slot-note")).toContainText("G3");
      await expect(slots.nth(1).locator(".slot-note")).toContainText("C4");
    },
    baseURL ?? "",
  );
});

test("full wizard → Concert · high G, then the tuner uses it", async ({ baseURL }) => {
  await withMic(
    SEQUENCES.highG.file,
    async (page) => {
      await toListenStep(page, /^Concert/, /^Thinner/);
      await expect(page.getByRole("button", { name: "Next" })).toBeEnabled({ timeout: 8000 });
      await page.getByRole("button", { name: "Next" }).click();
      await expect(page.getByRole("heading", { name: "Concert · high G" })).toBeVisible();
      await expect(page.getByText("Found it")).toBeVisible();
      await expect(page.getByText("Both mean high G.")).toBeVisible();
      await expect(page.locator(".string-map li")).toHaveCount(4);
      await page.getByRole("button", { name: "Tune it with me" }).click();
      await expect(page.locator(".tuner")).toBeVisible();
      await expect(page.locator(".tuning-row select")).toHaveValue("c-high-g");
    },
    baseURL ?? "",
  );
});

test("full wizard with unknown answers → low G from listening", async ({ baseURL }) => {
  await withMic(
    SEQUENCES.lowG.file,
    async (page) => {
      await toListenStep(page, /^Not sure/, /^Can't tell/);
      await expect(page.getByRole("button", { name: "Next" })).toBeEnabled({ timeout: 8000 });
      await page.getByRole("button", { name: "Next" }).click();
      await expect(page.getByRole("heading", { name: "Low G" })).toBeVisible();
      await expect(page.getByText("String 4 sounded lower than string 3.")).toBeVisible();
      await page.getByRole("button", { name: "Not right? Pick the tuning myself" }).click();
      await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
      await expect(page.locator("#s-tuning")).toHaveValue("c-low-g");
    },
    baseURL ?? "",
  );
});

test("a thin-looking string that sounds low shows the mismatch", async ({ baseURL }) => {
  await withMic(
    SEQUENCES.lowG.file,
    async (page) => {
      await toListenStep(page, /^Tenor/, /^Thinner/);
      await expect(page.getByRole("button", { name: "Next" })).toBeEnabled({ timeout: 8000 });
      await page.getByRole("button", { name: "Next" }).click();
      await expect(page.getByText("Check this")).toBeVisible();
      await page.getByRole("button", { name: "Listen again" }).click();
      await expect(page.getByRole("heading", { name: "Let the app listen" })).toBeVisible();
    },
    baseURL ?? "",
  );
});

test("guided tuning moves from string 4 to string 3 once G4 is in tune", async ({ baseURL }) => {
  await withMic(
    TONES.g4.file,
    async (page) => {
      await page.getByRole("button", { name: /Set up my ukulele/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: /^Concert/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: /^Thinner/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: "Skip" }).click();
      await page.getByRole("button", { name: "Tune it with me" }).click();
      await expect(page.locator(".guide-title")).toHaveText("String 4 · G");
      await expect(page.getByText("Round 1 of 2")).toBeVisible();
      await expect(page.locator(".guide-title")).toHaveText("String 3 · C", { timeout: 6000 });
      await page.getByRole("button", { name: "Skip string" }).click();
      await expect(page.locator(".guide-title")).toHaveText("String 2 · E");
      await page.getByRole("button", { name: "Leave guided tuning" }).click();
      await expect(page.locator(".tuning-row select")).toBeVisible();
      await expect(page.getByRole("button", { name: "Auto" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    },
    baseURL ?? "",
  );
});

test("finishing both rounds shows the done card", async ({ baseURL }) => {
  await withMic(
    TONES.e4flat.file,
    async (page) => {
      await page.getByRole("button", { name: /Set up my ukulele/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: /^Not sure/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: /^Can't tell/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: "Skip" }).click();
      await page.getByRole("button", { name: "Tune it with me" }).click();
      const skip = page.getByRole("button", { name: "Skip string" });
      for (let i = 0; i < 8; i++) await skip.click();
      await expect(page.locator(".guide-title")).toHaveText("All four strings are in tune.");
      await expect(skip).toBeHidden();
      await page.getByRole("button", { name: "Done" }).click();
      await expect(page.locator(".tuning-row select")).toBeVisible();
    },
    baseURL ?? "",
  );
});
