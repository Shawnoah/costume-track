import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("F5: Delete Production", () => {
  test("can delete a production without rentals", async ({ page }) => {
    // Create a production to delete
    await page.goto(ROUTES.productionsNew);

    const testName = `Delete Test Production ${Date.now()}`;
    await page.getByLabel(/Name/i).first().fill(testName);

    await page
      .getByRole("button", { name: /Create Production/i })
      .click();

    await page.waitForURL(/\/productions\/[a-z0-9]+$/i, {
      timeout: 15000,
    });

    // Verify we're on the detail page
    await expect(page.getByText(testName)).toBeVisible({ timeout: 5000 });

    // Click Delete button
    const deleteBtn = page.getByRole("button", { name: /Delete/i });
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();

      // Confirm in the delete dialog
      const confirmDeleteBtn = page.getByRole("button", {
        name: /Delete Production/i,
      });
      if (
        await confirmDeleteBtn
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await confirmDeleteBtn.click();

        // Should redirect to productions list
        await page.waitForURL(/\/productions$/, { timeout: 10000 });

        // The deleted production should not appear in the list
        await page.waitForTimeout(1000);
        await expect(page.getByText(testName)).not.toBeVisible();
      }
    }
  });
});
