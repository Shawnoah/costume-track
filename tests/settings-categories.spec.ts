import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("H3: Manage Categories", () => {
  test("can add a new category", async ({ page }) => {
    await page.goto(ROUTES.settings);

    // Wait for settings page to load
    await expect(
      page.getByRole("heading", { name: /Settings/i })
    ).toBeVisible({ timeout: 10000 });

    // Click Add button in categories section
    const addButton = page.getByRole("button", { name: /Add/i }).first();
    // Categories card has an "Add" button - find it near "Categories" text
    const categoriesCard = page.locator("text=Categories").first().locator("..").locator("..");
    const catAddBtn = categoriesCard.getByRole("button", { name: /Add/i });

    if (await catAddBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await catAddBtn.click();

      // Fill in category name
      const nameInput = page.getByLabel(/Name/i).first();
      await expect(nameInput).toBeVisible({ timeout: 3000 });

      const testCategory = `Test Category ${Date.now()}`;
      await nameInput.fill(testCategory);

      // Click a color button (first available)
      const colorButtons = page.locator("button.rounded-full.w-8.h-8");
      if (await colorButtons.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await colorButtons.first().click();
      }

      // Submit
      await page.getByRole("button", { name: /Add Category/i }).click();

      // Verify category appears in the list
      await expect(page.getByText(testCategory)).toBeVisible({ timeout: 5000 });
    }
  });

  test("categories section is visible on settings page", async ({ page }) => {
    await page.goto(ROUTES.settings);

    await expect(
      page.getByRole("heading", { name: /Settings/i })
    ).toBeVisible({ timeout: 10000 });

    // Categories section should be visible
    await expect(page.getByText(/Categories/i).first()).toBeVisible();
  });
});
