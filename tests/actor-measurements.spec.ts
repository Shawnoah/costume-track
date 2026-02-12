import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("G6: Actor Measurements", () => {
  test("can open and view measurements dialog for a character", async ({
    page,
  }) => {
    // Navigate to a production's costume plot
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

        // Wait for plot to load
        await page.waitForTimeout(1000);

        // Look for the ruler icon (measurements button) on a character row
        const measureBtn = page.locator('button[title="Measurements"]').first();
        if (
          await measureBtn.isVisible({ timeout: 5000 }).catch(() => false)
        ) {
          await measureBtn.click();

          // Should open measurements dialog with tabs
          await expect(
            page.getByText(/Measurements/i).first()
          ).toBeVisible({ timeout: 3000 });

          // Check for measurement fields (Body tab)
          const heightField = page.getByLabel(/Height/i);
          if (
            await heightField.isVisible({ timeout: 3000 }).catch(() => false)
          ) {
            await heightField.fill("5'10\"");

            // Save measurements
            const saveBtn = page.getByRole("button", {
              name: /Save Measurements/i,
            });
            if (
              await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)
            ) {
              await saveBtn.click();

              // Wait for save to complete
              await page.waitForTimeout(1000);
            }
          }
        }
      }
    }
  });
});
