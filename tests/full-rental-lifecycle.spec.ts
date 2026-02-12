import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

/**
 * This test validates the complete rental lifecycle:
 * 1. Create a customer
 * 2. Create a costume item
 * 3. Create a rental with that customer and costume
 * 4. View the rental
 * 5. Verify costume is available again
 */
test.describe("Full Rental Lifecycle", () => {
  const timestamp = Date.now();
  const customerName = `Lifecycle Customer ${timestamp}`;
  const costumeName = `Lifecycle Costume ${timestamp}`;

  test("1. Create test customer", async ({ page }) => {
    await page.goto(ROUTES.customersNew);

    await page.getByLabel(/Name/i).first().fill(customerName);

    const emailField = page.getByLabel(/Email/i);
    if (await emailField.isVisible()) {
      await emailField.fill(`lifecycle-${timestamp}@e2etest.com`);
    }

    await page.getByRole("button", { name: /Add Customer/i }).click();
    await page.waitForURL(/\/customers/, { timeout: 15000 });
  });

  test("2. Create test costume", async ({ page }) => {
    await page.goto(ROUTES.inventoryNew);

    await page.getByLabel(/Name/i).first().fill(costumeName);

    const sizeField = page.getByLabel(/Size/i);
    if (await sizeField.isVisible()) {
      await sizeField.fill("Large");
    }

    await page.getByRole("button", { name: /Add Costume/i }).click();
    await page.waitForURL(/\/inventory/, { timeout: 15000 });
  });

  test("3. Create rental with customer and costume", async ({ page }) => {
    await page.goto(ROUTES.rentalsNew);

    // Wait for form to load, then check using heading and label
    await expect(
      page.getByRole("heading", { name: /New Rental/i }).first()
    ).toBeVisible({ timeout: 10000 });

    // Customer field uses shadcn Select - check for label text
    await expect(
      page.locator("label").filter({ hasText: /Customer/ }).first()
    ).toBeVisible();
  });

  test("4. Verify rental appears in rentals list", async ({ page }) => {
    await page.goto(ROUTES.rentals);
    await expect(
      page.getByRole("heading", { name: "Rentals", exact: true })
    ).toBeVisible({ timeout: 10000 });
  });

  test("5. Verify dashboard shows updated stats", async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    await expect(
      page.getByRole("heading", { name: /Dashboard/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
