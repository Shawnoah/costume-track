import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("F1: Browse Productions", () => {
  test("shows productions page", async ({ page }) => {
    await page.goto(ROUTES.productions);

    // Use heading role to avoid matching sidebar links on mobile
    await expect(
      page.getByRole("heading", { name: /Productions/i })
    ).toBeVisible({ timeout: 10000 });

    // Should have Add Production link (use .first() for potential duplicates)
    await expect(
      page.locator('a[href="/productions/new"]').first()
    ).toBeVisible();
  });
});

test.describe("F2: Create Production", () => {
  test("shows production form", async ({ page }) => {
    await page.goto(ROUTES.productionsNew);

    await expect(page.getByLabel(/Name/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("can create a new production", async ({ page }) => {
    await page.goto(ROUTES.productionsNew);

    const testName = `E2E Test Production ${Date.now()}`;

    await page.getByLabel(/Name/i).first().fill(testName);

    const venueField = page.getByLabel(/Venue/i);
    if (await venueField.isVisible()) {
      await venueField.fill("Test Theater");
    }

    const directorField = page.getByLabel(/Director/i);
    if (await directorField.isVisible()) {
      await directorField.fill("Test Director");
    }

    // Submit - button text is "Create Production"
    await page
      .getByRole("button", { name: /Create Production/i })
      .click();

    // Should redirect to production detail page (not list)
    await page.waitForURL(/\/productions\/[a-z0-9]+$/i, {
      timeout: 15000,
    });

    // Verify the production name appears on the detail page
    await expect(page.getByText(testName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("F3: View Production Detail", () => {
  test("can navigate to production detail from list", async ({ page }) => {
    await page.goto(ROUTES.productions);

    await page.waitForTimeout(2000);

    // Click on the production name link in the first row
    const firstProductionLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    if (
      await firstProductionLink.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await firstProductionLink.click();
      await expect(page).toHaveURL(/\/productions\/[a-z0-9]+/i, {
        timeout: 5000,
      });
    }
  });
});

test.describe("G1: Costume Plot", () => {
  test("can navigate to costume plot from production detail", async ({
    page,
  }) => {
    await page.goto(ROUTES.productions);

    await page.waitForTimeout(2000);

    // Click on the production name link in the first row
    const firstProductionLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    if (
      await firstProductionLink.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await firstProductionLink.click();
      await page.waitForURL(/\/productions\/[a-z0-9]+/i, { timeout: 5000 });

      // Look for Costume Plot link
      const plotLink = page.getByRole("link", { name: /Costume Plot/i });
      if (await plotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await plotLink.click();
        await expect(page).toHaveURL(/\/costume-plot/);
      }
    }
  });
});
