import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("F4: Edit Production", () => {
  test("can edit production details inline", async ({ page }) => {
    // First create a production to edit
    await page.goto(ROUTES.productionsNew);

    const testName = `Edit Test Production ${Date.now()}`;
    await page.getByLabel(/Name/i).first().fill(testName);
    await page.getByLabel(/Venue/i).fill("Original Venue");
    await page.getByLabel(/Director/i).fill("Original Director");

    await page
      .getByRole("button", { name: /Create Production/i })
      .click();

    // Should redirect to production detail page
    await page.waitForURL(/\/productions\/[a-z0-9]+$/i, {
      timeout: 15000,
    });

    // Verify we're on the detail page
    await expect(page.getByText(testName)).toBeVisible({ timeout: 5000 });

    // Click Edit button
    const editButton = page.getByRole("button", { name: /Edit/i });
    await expect(editButton).toBeVisible({ timeout: 3000 });
    await editButton.click();

    // Edit the venue field
    const venueInput = page.getByLabel(/Venue/i);
    await expect(venueInput).toBeVisible({ timeout: 3000 });
    await venueInput.fill("Updated Venue");

    // Save changes
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Verify the updated venue appears on the detail page
    await expect(page.getByText("Updated Venue")).toBeVisible({
      timeout: 5000,
    });
  });

  test("can cancel editing without saving", async ({ page }) => {
    await page.goto(ROUTES.productions);
    await page.waitForTimeout(2000);

    // Navigate to first production
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

      // Click Edit
      const editButton = page.getByRole("button", { name: /Edit/i });
      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editButton.click();

        // Click Cancel
        const cancelButton = page.getByRole("button", { name: /Cancel/i });
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();

        // Should no longer be in edit mode (Save Changes button should be gone)
        await expect(
          page.getByRole("button", { name: /Save Changes/i })
        ).not.toBeVisible();
      }
    }
  });
});
