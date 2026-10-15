import { test as setup, expect } from "@playwright/test";

/**
 * Authenticates once via the real `/login` form (same selectors as
 * `scripts/capture-authenticated-pages.mjs`) and persists storageState for
 * every other E2E spec to reuse — avoids a slow UI login per test.
 */
const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page, baseURL }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_EMAIL and E2E_PASSWORD are required to run Assistant E2E tests.");
  }

  // Force English so spec locators are stable regardless of the app's
  // Indonesian default locale (`i18n/config.ts` — `defaultLocale: "id"`).
  // Product UI stays Indonesian-first; this only pins the test session.
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL }]);

  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: authFile });
});
