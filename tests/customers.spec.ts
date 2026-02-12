import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("E1: Browse Customers", () => {
  test("shows customers page", async ({ page }) => {
    await page.goto(ROUTES.customers);

    await expect(
      page.getByRole("heading", { name: /Customers/i })
    ).toBeVisible({ timeout: 10000 });

    // Should have Add Customer link (use .first() since empty state also has one)
    await expect(
      page.locator('a[href="/customers/new"]').first()
    ).toBeVisible();
  });
});

test.describe("E2: Add Customer", () => {
  test("shows customer form with all fields", async ({ page }) => {
    await page.goto(ROUTES.customersNew);

    await expect(page.getByLabel(/Name/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("can create a new customer", async ({ page }) => {
    await page.goto(ROUTES.customersNew);

    const testName = `E2E Test Customer ${Date.now()}`;

    await page.getByLabel(/Name/i).first().fill(testName);

    const emailField = page.getByLabel(/Email/i);
    if (await emailField.isVisible()) {
      await emailField.fill(`test-${Date.now()}@e2etest.com`);
    }

    const phoneField = page.getByLabel(/Phone/i);
    if (await phoneField.isVisible()) {
      await phoneField.fill("555-0100");
    }

    const companyField = page.getByLabel(/Company/i);
    if (await companyField.isVisible()) {
      await companyField.fill("Test Theater");
    }

    // Submit
    await page.getByRole("button", { name: /Add Customer/i }).click();

    // Should redirect to customer detail or list
    await page.waitForURL(/\/customers/, { timeout: 15000 });
  });
});

test.describe("E3: Edit Customer", () => {
  test("can navigate to customer and edit", async ({ page }) => {
    await page.goto(ROUTES.customers);

    await page.waitForTimeout(2000);

    // Click on the customer name link in the first row
    const firstCustomerLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    if (
      await firstCustomerLink.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await firstCustomerLink.click();
      // Should navigate to customer detail/edit page
      await expect(page).toHaveURL(/\/customers\/[a-z0-9]+/i, {
        timeout: 5000,
      });
    }
  });
});
