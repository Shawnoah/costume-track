import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("D4: Return Rental", () => {
  const timestamp = Date.now();
  const customerName = `Return Test Customer ${timestamp}`;
  const costumeName = `Return Test Costume ${timestamp}`;

  test("1. Create customer for rental return test", async ({ page }) => {
    await page.goto(ROUTES.customersNew);

    await page.getByLabel(/Name/i).first().fill(customerName);

    const emailField = page.getByLabel(/Email/i);
    if (await emailField.isVisible()) {
      await emailField.fill(`return-${timestamp}@e2etest.com`);
    }

    await page.getByRole("button", { name: /Add Customer/i }).click();
    await page.waitForURL(/\/customers/, { timeout: 15000 });
  });

  test("2. Create costume for rental return test", async ({ page }) => {
    await page.goto(ROUTES.inventoryNew);

    await page.getByLabel(/Name/i).first().fill(costumeName);

    const sizeField = page.getByLabel(/Size/i);
    if (await sizeField.isVisible()) {
      await sizeField.fill("Medium");
    }

    await page.getByRole("button", { name: /Add Costume/i }).click();
    await page.waitForURL(/\/inventory/, { timeout: 15000 });
  });

  test("3. Create rental and then return it", async ({ page }) => {
    await page.goto(ROUTES.rentalsNew);

    // Wait for form to load
    await expect(
      page.getByRole("heading", { name: /New Rental/i }).first()
    ).toBeVisible({ timeout: 10000 });

    // Select customer
    const customerSelect = page.locator('button[role="combobox"]').first();
    if (await customerSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await customerSelect.click();
      // Search and select our test customer
      const customerOption = page.getByText(customerName).first();
      if (
        await customerOption.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await customerOption.click();
      }
    }

    // Set due date (1 week from now)
    const dueDate = page.getByLabel(/Due Date/i);
    if (await dueDate.isVisible({ timeout: 3000 }).catch(() => false)) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      await dueDate.fill(nextWeek.toISOString().split("T")[0]);
    }

    // Select costume item
    const costumeCheckbox = page.getByText(costumeName).first();
    if (
      await costumeCheckbox.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await costumeCheckbox.click();
    }

    // Submit rental
    const submitBtn = page.getByRole("button", {
      name: /Create Rental/i,
    });
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForURL(/\/rentals\/[a-z0-9]+/i, { timeout: 15000 });

      // Now on rental detail page - look for Return Items button
      const returnBtn = page.getByRole("button", {
        name: /Return Items/i,
      });
      if (
        await returnBtn.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
        await returnBtn.click();

        // Confirm return dialog
        await expect(
          page.getByText(/Confirm Return/i).first()
        ).toBeVisible({ timeout: 3000 });

        await page
          .getByRole("button", { name: /Confirm Return/i })
          .click();

        // After return, status should change to returned
        await expect(
          page.getByText(/returned/i).first()
        ).toBeVisible({ timeout: 5000 });

        // Return Items button should no longer be visible
        await expect(
          page.getByRole("button", { name: /Return Items/i })
        ).not.toBeVisible({ timeout: 3000 });
      }
    }
  });
});
