import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { FIXTURE_DIR, TONES } from "./wav";

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map(
    (v) => `${label}: ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary).toEqual([]);
}

for (const scheme of ["dark", "light"] as const) {
  test(`no axe violations on any screen (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await audit(page, "start");
    await page.getByRole("button", { name: "Tune by ear with reference tones" }).click();
    await audit(page, "tuner");
    await page.getByRole("button", { name: "Play C4 reference tone" }).click();
    await page.getByRole("button", { name: /^E ?4 ·/ }).click();
    await audit(page, "tuner-locked-tone");
    await page.getByRole("button", { name: "Settings" }).click();
    await audit(page, "settings");
    await page.getByRole("button", { name: "Back to tuner" }).click();
    await page.getByRole("button", { name: "Help" }).click();
    await audit(page, "help");
  });
}

for (const scheme of ["dark", "light"] as const) {
  test(`no axe violations in the setup wizard (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await audit(page, "start-first-launch");
    await page.getByRole("button", { name: /Set up my ukulele/ }).click();
    await audit(page, "setup-hold");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: /^Concert/ }).click();
    await audit(page, "setup-size");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: /^Thinner/ }).click();
    await audit(page, "setup-look");
    await page.getByRole("button", { name: "Next" }).click();
    await audit(page, "setup-listen");
    await page.getByRole("button", { name: "Skip" }).click();
    await audit(page, "setup-result");
  });
}

test("no axe violations on the microphone error screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start tuner" }).click();
  await expect(page.locator(".mic-error")).toBeVisible();
  await audit(page, "mic-error");
});

for (const scheme of ["dark", "light"] as const) {
  test(`no axe violations in guided tuning (${scheme})`, async ({ baseURL }) => {
    const browser = await chromium.launch({
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-audio-capture=${join(FIXTURE_DIR, TONES.e4flat.file)}`,
      ],
    });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(baseURL ?? "");
      await page.getByRole("button", { name: /Set up my ukulele/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: /^Concert/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: /^Thinner/ }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: "Skip" }).click();
      await page.getByRole("button", { name: "Tune it with me" }).click();
      await expect(page.locator(".guide-title")).toHaveText("String 4 · G");
      await audit(page, "guided");
      for (let i = 0; i < 8; i++) await page.getByRole("button", { name: "Skip string" }).click();
      await audit(page, "guided-done");
    } finally {
      await browser.close();
    }
  });
}

test.describe("pt-BR", () => {
  test.use({ locale: "pt-BR" });

  test("no axe violations on the Portuguese screens", async ({ page }) => {
    await page.goto("/");
    await audit(page, "pt-start");
    await page.getByRole("button", { name: /Configurar meu ukulele/ }).click();
    await audit(page, "pt-setup-hold");
    await page.getByRole("button", { name: "Avançar" }).click();
    await page.getByRole("button", { name: /^Concert/ }).click();
    await audit(page, "pt-setup-size");
    await page.getByRole("button", { name: "Avançar" }).click();
    await page.getByRole("button", { name: /^Mais fina/ }).click();
    await audit(page, "pt-setup-look");
    await page.getByRole("button", { name: "Avançar" }).click();
    await page.getByRole("button", { name: "Pular" }).click();
    await audit(page, "pt-setup-result");
    await page.getByRole("button", { name: "Não é esse? Escolher a afinação" }).click();
    await audit(page, "pt-settings");
  });
});
