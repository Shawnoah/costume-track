import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Auth setup - runs first to create authenticated state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      testIgnore: /.*\.unauth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, "tests", ".auth", "user.json"),
      },
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      testIgnore: /.*\.unauth\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        storageState: path.join(__dirname, "tests", ".auth", "user.json"),
      },
      dependencies: ["setup"],
    },
    // Unauthenticated tests (login, register, landing page)
    {
      name: "unauthenticated",
      testMatch: /.*\.unauth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
