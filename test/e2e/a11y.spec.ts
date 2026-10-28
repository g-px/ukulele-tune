import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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

test("no axe violations on the microphone error screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start tuner" }).click();
  await expect(page.locator(".mic-error")).toBeVisible();
  await audit(page, "mic-error");
});
