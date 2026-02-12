import { test as setup, expect } from "@playwright/test";
import path from "path";
import { TEST_USER, TEST_INVITE_CODE, ROUTES } from "./fixtures/test-config";

const authFile = path.join(__dirname, ".auth", "user.json");

setup("authenticate test user", async ({ page }) => {
  // First, try to register the test user (may already exist)
  const registerRes = await page.request.post("/api/auth/register", {
    data: {
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: TEST_USER.password,
      organizationName: TEST_USER.organizationName,
      inviteCode: TEST_INVITE_CODE,
    },
  });

  // 201 = created, 400 = already exists - both are fine
  if (!registerRes.ok()) {
    const body = await registerRes.json();
    if (!body.message?.includes("already exists")) {
      console.log(
        "Registration response (non-critical):",
        registerRes.status(),
        body.message
      );
    }
  }

  // Now log in via the UI
  await page.goto(ROUTES.login);
  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect - could be dashboard or onboarding
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

  // If redirected to onboarding, complete it
  if (page.url().includes("/onboarding")) {
    await page
      .getByLabel("Organization Name")
      .fill(TEST_USER.organizationName);
    await page
      .getByRole("button", { name: /Create Organization/i })
      .click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });
  }

  await expect(page.locator("body")).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
