import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("H1: Organization Profile", () => {
  test("shows organization profile form", async ({ page }) => {
    await page.goto(ROUTES.settings);

    await expect(
      page.getByRole("heading", { name: /Settings/i })
    ).toBeVisible({ timeout: 10000 });

    // Should show shop name field
    await expect(page.getByLabel(/Shop Name/i)).toBeVisible({ timeout: 5000 });
  });

  test("can update organization name", async ({ page }) => {
    await page.goto(ROUTES.settings);

    await expect(
      page.getByRole("heading", { name: /Settings/i })
    ).toBeVisible({ timeout: 10000 });

    const shopNameField = page.getByLabel(/Shop Name/i);
    await expect(shopNameField).toBeVisible({ timeout: 5000 });

    // Get current value, modify, save, verify
    const currentName = await shopNameField.inputValue();
    const updatedName = currentName.includes("Updated")
      ? currentName.replace(" Updated", "")
      : `${currentName} Updated`;

    await shopNameField.fill(updatedName);

    // Click Save Profile and wait for the button to re-enable (save complete)
    const saveBtn = page.getByRole("button", { name: /Save Profile/i });
    await saveBtn.click();

    // Wait for save to complete - button text changes briefly to "Saved!"
    // then returns to "Save Profile". Wait for the button to be enabled again.
    await page.waitForTimeout(2000);

    // Reload page and verify the name persisted
    await page.reload();
    await expect(shopNameField).toBeVisible({ timeout: 10000 });
    await expect(shopNameField).toHaveValue(updatedName);

    // Revert to original name
    await shopNameField.fill(currentName);
    await page.getByRole("button", { name: /Save Profile/i }).click();
    await page.waitForTimeout(2000);
  });

  test("shows public page toggle", async ({ page }) => {
    await page.goto(ROUTES.settings);

    await expect(
      page.getByRole("heading", { name: /Settings/i })
    ).toBeVisible({ timeout: 10000 });

    // Public landing page toggle should be visible
    await expect(
      page.getByText(/Public Landing Page/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
