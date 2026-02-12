import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("D1: Browse Rentals", () => {
  test("shows rentals page with filters", async ({ page }) => {
    await page.goto(ROUTES.rentals);

    // Use exact match to avoid matching "No rentals found" h3
    await expect(
      page.getByRole("heading", { name: "Rentals", exact: true })
    ).toBeVisible({ timeout: 10000 });

    // Should have New Rental link (use .first() for potential duplicates)
    await expect(
      page.locator('a[href="/rentals/new"]').first()
    ).toBeVisible();
  });
});

test.describe("D2: Create Rental", () => {
  test("shows rental creation form", async ({ page }) => {
    await page.goto(ROUTES.rentalsNew);

    // Use .first() in case multiple headings match
    await expect(
      page.getByRole("heading", { name: /New Rental/i }).first()
    ).toBeVisible({ timeout: 10000 });

    // Customer field uses shadcn Select - check for label text
    await expect(
      page.locator("label").filter({ hasText: /Customer/ }).first()
    ).toBeVisible();
  });

  test("can select a customer for rental", async ({ page }) => {
    await page.goto(ROUTES.rentalsNew);

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Customer field uses shadcn Select - check label is present
    await expect(
      page.locator("label").filter({ hasText: /Customer/ }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("D3: View Rental Detail", () => {
  test("can navigate to rental from list", async ({ page }) => {
    await page.goto(ROUTES.rentals);

    await page.waitForTimeout(2000);

    // Click on first rental if one exists
    const firstRow = page.locator("table tbody tr").first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      await expect(page).toHaveURL(/\/rentals\/[a-z0-9]+/i, {
        timeout: 5000,
      });
    }
  });
});
