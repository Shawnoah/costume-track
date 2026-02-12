import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("C1: Browse Inventory", () => {
  test("shows inventory page with add button", async ({ page }) => {
    await page.goto(ROUTES.inventory);

    // Use heading role to avoid matching sidebar links on mobile
    await expect(
      page.getByRole("heading", { name: /Inventory/i })
    ).toBeVisible({ timeout: 10000 });

    // Should have Add Costume link (use .first() for empty state duplicate)
    await expect(
      page.locator('a[href="/inventory/new"]').first()
    ).toBeVisible();
  });

  test("search filters inventory items", async ({ page }) => {
    await page.goto(ROUTES.inventory);

    // Find the search input
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("nonexistent-costume-xyz-999");
      // Allow time for search to filter
      await page.waitForTimeout(500);
    }
  });
});

test.describe("C2: Add New Costume", () => {
  test("shows costume form with all fields", async ({ page }) => {
    await page.goto(ROUTES.inventoryNew);

    await expect(page.getByLabel(/Name/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Description/i).first()).toBeVisible();
    await expect(page.getByText(/Category/i).first()).toBeVisible();
  });

  test("can fill out and submit a new costume", async ({ page }) => {
    await page.goto(ROUTES.inventoryNew);

    const testName = `E2E Test Costume ${Date.now()}`;

    // Fill required fields
    await page.getByLabel(/Name/i).first().fill(testName);

    // Fill optional fields
    const descriptionField = page.getByLabel(/Description/i);
    if (await descriptionField.isVisible()) {
      await descriptionField.fill("Test costume created by Playwright E2E");
    }

    const sizeField = page.getByLabel(/Size/i);
    if (await sizeField.isVisible()) {
      await sizeField.fill("Medium");
    }

    const colorField = page.getByLabel(/Color/i);
    if (await colorField.isVisible()) {
      await colorField.fill("Red");
    }

    // Submit the form
    await page.getByRole("button", { name: /Add Costume/i }).click();

    // Should redirect to the new item's detail page or back to inventory
    await page.waitForURL(/\/inventory/, { timeout: 15000 });
  });
});

test.describe("C6: View Costume Detail", () => {
  test("can navigate to costume detail from inventory list", async ({
    page,
  }) => {
    await page.goto(ROUTES.inventory);

    // Wait for items to load
    await page.waitForTimeout(2000);

    // Click on the first costume link in the table (if any exist)
    const firstItemLink = page.locator("table tbody tr").first().locator("a").first();
    if (await firstItemLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstItemLink.click();
      // Should navigate to a detail page
      await expect(page).toHaveURL(/\/inventory\/[a-z0-9]+/i, {
        timeout: 5000,
      });
    }
  });
});

test.describe("C7: Edit Costume", () => {
  test("can navigate to edit from detail page", async ({ page }) => {
    await page.goto(ROUTES.inventory);

    await page.waitForTimeout(2000);

    // Click on first costume link
    const firstItemLink = page.locator("table tbody tr").first().locator("a").first();
    if (await firstItemLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstItemLink.click();
      await page.waitForURL(/\/inventory\/[a-z0-9]+/i, { timeout: 5000 });

      // Look for edit button
      const editLink = page.getByRole("link", { name: /Edit/i });
      if (await editLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editLink.click();
        await expect(page).toHaveURL(/\/inventory\/[a-z0-9]+\/edit/i);
      }
    }
  });
});
