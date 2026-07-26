import { test, expect } from "@playwright/test";

// Common mobile width (iPhone 13 viewport), chromium only — the project's
// "chromium" project already fixes the browser; a full `devices["iPhone 13"]`
// preset would switch to webkit, which isn't installed in this environment
// or in CI (`playwright install --with-deps chromium` only).
const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.use({ viewport: MOBILE_VIEWPORT });

test.describe("Assistant — mobile viewport", () => {
  test("composer and history trigger stay reachable, no page-level horizontal overflow", async ({ page }) => {
    await page.goto("/assistant");

    await expect(page.getByRole("heading", { name: "Assistant" })).toBeVisible();
    await expect(page.locator("#assistant-instruction")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open conversation history" })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("history modal is usable at mobile width", async ({ page }) => {
    await page.goto("/assistant");
    await page.getByRole("button", { name: "Open conversation history" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});
