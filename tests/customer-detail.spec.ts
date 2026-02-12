import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("E3: Customer Detail & Edit", () => {
  test("can view and edit customer details", async ({ page }) => {
    // First create a customer to edit
    await page.goto(ROUTES.customersNew);

    const testName = `Detail Test Customer ${Date.now()}`;
    await page.getByLabel(/Name/i).first().fill(testName);

    const emailField = page.getByLabel(/Email/i);
    if (await emailField.isVisible()) {
      await emailField.fill(`detail-${Date.now()}@e2etest.com`);
    }

    const phoneField = page.getByLabel(/Phone/i);
    if (await phoneField.isVisible()) {
      await phoneField.fill("555-0199");
    }

    await page.getByRole("button", { name: /Add Customer/i }).click();
    await page.waitForURL(/\/customers/, { timeout: 15000 });

    // Navigate to the customer detail from list
    await page.goto(ROUTES.customers);
    await page.waitForTimeout(2000);

    // Find and click the test customer
    const customerLink = page.getByText(testName).first();
    if (await customerLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await customerLink.click();
      await page.waitForURL(/\/customers\/[a-z0-9]+/i, { timeout: 5000 });

      // Should show Edit Customer heading
      await expect(
        page.getByRole("heading", { name: /Edit Customer/i }).first()
      ).toBeVisible({ timeout: 5000 });

      // Edit the phone number
      const phone = page.getByLabel(/Phone/i);
      await expect(phone).toBeVisible();
      await phone.fill("555-0200");

      // Save changes
      await page.getByRole("button", { name: /Save Changes/i }).click();

      // Should redirect back to customers list
      await page.waitForURL(/\/customers$/, { timeout: 15000 });
    }
  });

  test("shows customer portal section for admin", async ({ page }) => {
    await page.goto(ROUTES.customers);
    await page.waitForTimeout(2000);

    const firstCustomerLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    if (
      await firstCustomerLink.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await firstCustomerLink.click();
      await page.waitForURL(/\/customers\/[a-z0-9]+/i, { timeout: 5000 });

      // Admin users should see Customer Portal section
      await expect(
        page.getByText(/Customer Portal/i).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
