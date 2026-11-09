import { expect, test, type Page } from "@playwright/test";

test.use({ locale: "pt-BR" });

async function noHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label} overflows horizontally`).toBeLessThanOrEqual(0);
}

test("a Portuguese browser gets the Portuguese app", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("button", { name: "Abrir afinador" })).toBeVisible();
  await noHorizontalOverflow(page, "start");
  await page.getByRole("button", { name: "Afinar de ouvido com notas de referência" }).click();
  await expect(page.locator(".tuning-row select option:checked")).toHaveText(
    "Padrão em Dó (Sol agudo) · gCEA",
  );
  await noHorizontalOverflow(page, "tuner");
  await page.getByRole("button", { name: "Configurações" }).click();
  await noHorizontalOverflow(page, "settings");
  await page.getByRole("button", { name: "Voltar ao afinador" }).click();
  await page.getByRole("button", { name: "Ajuda" }).click();
  await expect(page.getByRole("heading", { name: "Sol agudo ou Sol grave?" })).toBeVisible();
  await noHorizontalOverflow(page, "help");
});

test("choosing English in Settings reloads in English and sticks", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Afinar de ouvido com notas de referência" }).click();
  await page.getByRole("button", { name: "Configurações" }).click();
  await page
    .getByRole("group", { name: "Idioma" })
    .getByRole("button", { name: "English" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Start tuner" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Start tuner" })).toBeVisible();
});

test("the setup wizard fits and shows solfège in Portuguese", async ({ page }) => {
  await page.goto("/");
  await noHorizontalOverflow(page, "start-first-launch");
  await page.getByRole("button", { name: /Configurar meu ukulele/ }).click();
  await expect(page.getByRole("heading", { name: "Segure assim" })).toBeVisible();
  await noHorizontalOverflow(page, "setup-hold");
  await page.getByRole("button", { name: "Avançar" }).click();
  await page.getByRole("button", { name: /^Concert/ }).click();
  await noHorizontalOverflow(page, "setup-size");
  await page.getByRole("button", { name: "Avançar" }).click();
  await page.getByRole("button", { name: /^Mais fina/ }).click();
  await noHorizontalOverflow(page, "setup-look");
  await page.getByRole("button", { name: "Avançar" }).click();
  await noHorizontalOverflow(page, "setup-listen");
  await page.getByRole("button", { name: "Pular" }).click();
  await expect(page.getByRole("heading", { name: "Concert · Sol agudo" })).toBeVisible();
  await expect(page.locator(".map-letter small")).toHaveText(["Sol", "Dó", "Mi", "Lá"]);
  await noHorizontalOverflow(page, "setup-result");
});
