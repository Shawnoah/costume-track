import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";
import { navigateViaSidebar } from "./fixtures/test-helpers";

test.describe("B1: Dashboard", () => {
  test("loads and shows stats cards", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    // Use heading role to avoid matching sidebar links on mobile
    await expect(
      page.getByRole("heading", { name: /Dashboard/i })
    ).toBeVisible({ timeout: 10000 });

    // Check stat card content (card titles render inside the main area)
    await expect(page.getByText(/Active Rentals/i)).toBeVisible();
    await expect(page.getByText(/Overdue/i).first()).toBeVisible();
  });

  test("shows quick action buttons", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    // Use href-based selectors (works on both mobile and desktop)
    await expect(page.locator('a[href="/rentals/new"]')).toBeVisible();
    await expect(page.locator('a[href="/inventory/new"]')).toBeVisible();
  });

  test("quick action: Rental navigates to rental form", async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    await page.locator('a[href="/rentals/new"]').click();
    await expect(page).toHaveURL(/\/rentals\/new/);
  });

  test("quick action: Costume navigates to inventory form", async ({
    page,
  }) => {
    await page.goto(ROUTES.dashboard);
    await page.locator('a[href="/inventory/new"]').click();
    await expect(page).toHaveURL(/\/inventory\/new/);
  });
});

test.describe("Navigation", () => {
  test("sidebar links navigate to correct pages", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    // Navigate to Inventory (handles mobile hamburger menu)
    await navigateViaSidebar(page, "Inventory");
    await expect(page).toHaveURL(/\/inventory/);

    // Navigate to Rentals
    await navigateViaSidebar(page, "Rentals");
    await expect(page).toHaveURL(/\/rentals/);

    // Navigate to Customers
    await navigateViaSidebar(page, "Customers");
    await expect(page).toHaveURL(/\/customers/);

    // Navigate to Productions
    await navigateViaSidebar(page, "Productions");
    await expect(page).toHaveURL(/\/productions/);

    // Navigate to Settings
    await navigateViaSidebar(page, "Settings");
    await expect(page).toHaveURL(/\/settings/);

    // Back to Dashboard
    await navigateViaSidebar(page, "Dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
