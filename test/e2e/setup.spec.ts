import { expect, test } from "@playwright/test";

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
