import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("H1: Settings Page", () => {
  test("loads settings page with sections", async ({ page }) => {
    await page.goto(ROUTES.settings);

    // Use heading role to avoid matching sidebar "Settings" link on mobile
    await expect(
      page.getByRole("heading", { name: /Settings/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows team members section", async ({ page }) => {
    await page.goto(ROUTES.settings);

    // Wait for page to load, then check for Team Members card title
    await expect(
      page.getByRole("heading", { name: /Settings/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/Team Members/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows categories management", async ({ page }) => {
    await page.goto(ROUTES.settings);

    await expect(page.getByText(/Categories/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
