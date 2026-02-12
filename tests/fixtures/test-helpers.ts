import { Page } from "@playwright/test";

/**
 * Opens the mobile hamburger menu if it's visible (mobile viewport).
 * No-op on desktop where sidebar is always visible.
 */
export async function openMobileMenuIfNeeded(page: Page) {
  const hamburger = page.getByRole("button", { name: /Open menu/i });
  if (await hamburger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await hamburger.click();
    // Wait for sheet animation to fully complete
    await page.waitForTimeout(500);
  }
}

/**
 * Navigates via the sidebar, handling mobile hamburger menu if needed.
 * Waits for the page to stabilize before and after clicking.
 */
export async function navigateViaSidebar(page: Page, linkName: string) {
  // Wait for current page to be fully loaded before interacting
  await page.waitForLoadState("domcontentloaded");
  await openMobileMenuIfNeeded(page);

  const link = page.getByRole("link", { name: linkName });
  try {
    await link.click({ timeout: 5000 });
  } catch {
    // If element was detached during sheet animation, wait and retry
    await page.waitForTimeout(500);
    await openMobileMenuIfNeeded(page);
    await page.getByRole("link", { name: linkName }).click({ timeout: 5000 });
  }

  // Wait for navigation to complete
  await page.waitForLoadState("domcontentloaded");
}
