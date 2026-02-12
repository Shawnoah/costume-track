import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("G2: Add Character to Costume Plot", () => {
  test("can add a character from costume plot page", async ({ page }) => {
    // Navigate to first production's costume plot
    await page.goto(ROUTES.productions);
    await page.waitForTimeout(2000);

    const firstProductionLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    if (
      await firstProductionLink
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await firstProductionLink.click();
      await page.waitForURL(/\/productions\/[a-z0-9]+/i, { timeout: 5000 });

      // Navigate to Costume Plot
      const plotLink = page.getByRole("link", { name: /Costume Plot/i });
      if (await plotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await plotLink.click();
        await page.waitForURL(/\/costume-plot/, { timeout: 5000 });

        // Click Add Character button
        const addCharBtn = page.getByRole("button", {
          name: /Add Character/i,
        });
        await expect(addCharBtn).toBeVisible({ timeout: 5000 });
        await addCharBtn.click();

        // Fill character name
        const charName = `Test Character ${Date.now()}`;
        const nameInput = page.getByLabel(/Character Name/i).first();
        if (
          await nameInput.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          // Use placeholder-based selector as fallback
          await nameInput.fill(charName);
        } else {
          const inputFallback = page
            .getByPlaceholder(/character/i)
            .first();
          await inputFallback.fill(charName);
        }

        // Submit the dialog
        const submitBtn = page
          .getByRole("button", { name: /Add Character/i })
          .last();
        await submitBtn.click();

        // Verify character appears in the plot
        await expect(page.getByText(charName)).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});

test.describe("G3: Add Scene to Costume Plot", () => {
  test("can add a scene from costume plot page", async ({ page }) => {
    await page.goto(ROUTES.productions);
    await page.waitForTimeout(2000);

    const firstProductionLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    if (
      await firstProductionLink
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await firstProductionLink.click();
      await page.waitForURL(/\/productions\/[a-z0-9]+/i, { timeout: 5000 });

      const plotLink = page.getByRole("link", { name: /Costume Plot/i });
      if (await plotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await plotLink.click();
        await page.waitForURL(/\/costume-plot/, { timeout: 5000 });

        // Click Add Scene button
        const addSceneBtn = page.getByRole("button", {
          name: /Add Scene/i,
        });
        await expect(addSceneBtn).toBeVisible({ timeout: 5000 });
        await addSceneBtn.click();

        // Fill scene name
        const sceneName = `Test Scene ${Date.now()}`;
        const nameInput = page.getByLabel(/Scene Name/i).first();
        if (
          await nameInput.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          await nameInput.fill(sceneName);
        } else {
          const inputFallback = page
            .getByPlaceholder(/scene/i)
            .first();
          await inputFallback.fill(sceneName);
        }

        // Submit
        const submitBtn = page
          .getByRole("button", { name: /Add Scene/i })
          .last();
        await submitBtn.click();

        // Verify scene appears
        await expect(page.getByText(sceneName)).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});
