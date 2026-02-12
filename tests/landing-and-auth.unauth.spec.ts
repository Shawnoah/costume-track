import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures/test-config";

test.describe("A1: Landing Page", () => {
  test("shows marketing content and navigation links", async ({ page }) => {
    await page.goto(ROUTES.home);

    // Hero heading
    await expect(
      page.getByRole("heading", { name: /Costume Professionals/i })
    ).toBeVisible();

    // CTA buttons
    await expect(
      page.getByRole("link", { name: /Start Free Trial/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Sign In/i }).first()
    ).toBeVisible();

    // Feature sections
    await expect(page.getByText("Inventory Tracking")).toBeVisible();
    await expect(page.getByText("Rental Management")).toBeVisible();
    await expect(page.getByText("Production Tracking")).toBeVisible();

    // Footer
    await expect(page.getByText(/CostumeTrack, LLC/i)).toBeVisible();
  });

  test("Get Started links to register page", async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.getByRole("link", { name: /Start Free Trial/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("Sign In links to login page", async ({ page }) => {
    await page.goto(ROUTES.home);
    await page
      .getByRole("link", { name: /Sign In/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("A2: Registration Page", () => {
  test("shows registration form with all required fields", async ({
    page,
  }) => {
    await page.goto(ROUTES.register);

    await expect(page.getByLabel("Organization Name")).toBeVisible();
    await expect(page.getByLabel("Your Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Invite Code")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create Account/i })
    ).toBeVisible();
  });

  test("shows validation error for missing invite code", async ({ page }) => {
    await page.goto(ROUTES.register);

    await page.getByLabel("Organization Name").fill("Test Org");
    await page.getByLabel("Your Name").fill("Test");
    await page.getByLabel("Email").fill("invalid-test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByLabel("Invite Code").fill("INVALID_CODE");

    await page.getByRole("button", { name: /Create Account/i }).click();

    // Should show error about invalid invite code
    await expect(page.getByText(/invalid invite code/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("links to login page", async ({ page }) => {
    await page.goto(ROUTES.register);
    await page.getByRole("link", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("A3: Login Page", () => {
  test("shows login form with email, password, and Google option", async ({
    page,
  }) => {
    await page.goto(ROUTES.login);

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sign In/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with Google/i })
    ).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto(ROUTES.login);

    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /Sign In/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("links to register page", async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.getByRole("link", { name: /Create one/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe("Auth redirects", () => {
  test("unauthenticated user accessing dashboard is redirected to login", async ({
    page,
  }) => {
    await page.goto(ROUTES.dashboard);
    // Should be redirected to login (NextAuth middleware or server-side check)
    await expect(page).toHaveURL(/\/(login|api\/auth)/i, { timeout: 10000 });
  });
});
