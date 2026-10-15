import { test, expect } from "@playwright/test";

test.describe("Assistant — empty state and composer", () => {
  test("protected page loads with header, empty state, composer, and history trigger", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/assistant");
    await expect(page).toHaveURL(/\/assistant/);

    await expect(page.getByRole("heading", { name: "Assistant" })).toBeVisible();
    await expect(page.getByText("Start a new conversation")).toBeVisible();

    const composer = page.locator("#assistant-instruction");
    await expect(composer).toBeVisible();
    await expect(composer).toBeEnabled();

    const historyTrigger = page.getByRole("button", { name: "Open conversation history" });
    await expect(historyTrigger).toBeVisible();

    const submitButton = page.getByRole("button", { name: "Send", exact: true });
    await expect(submitButton).toBeDisabled();

    // Whitespace-only input must not enable submission either.
    await composer.fill("   ");
    await expect(submitButton).toBeDisabled();
    await composer.fill("");

    expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("unauthenticated navigation is redirected away from /assistant", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/assistant");
    await expect(page).toHaveURL(/\/login/);
    await context.close();
  });
});
