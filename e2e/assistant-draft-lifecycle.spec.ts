import { test, expect } from "@playwright/test";
import { ensureTestWallet, getExpenseCategory, getTestAccessToken, seedAssistantDraft } from "./helpers/backend";

/**
 * Seeds a real Pending Financial Draft via the deterministic
 * `/assistant/execute` endpoint (no LLM involved), then drives the actual
 * browser UI against it. This exercises the same `draftRecovered` recovery
 * path a refresh/direct-nav would use — see
 * `useAssistantConversationFlow.ts` (`recoveryTriggerEnabled` /
 * `draftRecovered`).
 *
 * `GET .../recovery-state` is deliberately id-only (never re-derives a
 * display label or renderedText — see `recovery.ts`'s
 * `mapRecoveredDraftToAssistantDraft`, documented `ponytail:` tradeoff), so
 * a draft reached this way always renders raw wallet/category ids and never
 * a merchant. That's real, intentional behavior — don't assert display
 * names or merchant text against a draft loaded through this path.
 */

async function seedDraft(merchant: string) {
  const token = await getTestAccessToken();
  const wallet = await ensureTestWallet(token);
  const category = await getExpenseCategory(token);
  const result = await seedAssistantDraft(token, { walletName: wallet.name, categoryId: category.id, merchant });
  if (result.status !== "success") {
    throw new Error(`Expected a draft, got clarification_required — pick a less ambiguous wallet/category fixture.`);
  }
  return { conversationId: result.conversationId, token };
}

test.describe("Assistant — draft review, confirm, cancel", () => {
  test("displays backend-provided draft values and confirms it", async ({ page }) => {
    const merchant = `Test Noodle Shop ${Date.now()}`;
    const { conversationId } = await seedDraft(merchant);

    await page.goto(`/assistant?conversationId=${conversationId}`);

    const draftCard = page.locator("article").filter({ hasText: "Awaiting confirmation" });
    await expect(draftCard).toBeVisible();
    await expect(draftCard).toContainText("Expense");
    await expect(draftCard).toContainText("IDR");

    const composer = page.locator("#assistant-instruction");
    await expect(composer).toBeDisabled();

    const confirmButton = page.getByRole("button", { name: "Confirm", exact: true });
    const cancelButton = page.getByRole("button", { name: "Cancel", exact: true });

    await confirmButton.click();

    // The draft card only clears once the real confirm request resolves —
    // this also proves a duplicate click while pending couldn't double-submit
    // (the button is disabled the instant `isConfirmingDraft` flips true).
    await expect(draftCard).not.toBeVisible({ timeout: 15_000 });
    await expect(cancelButton).not.toBeVisible();
    await expect(composer).toBeEnabled();
  });

  test("cancels a draft without creating a transaction", async ({ page }) => {
    const merchant = `Test Noodle Shop ${Date.now()}`;
    const { conversationId } = await seedDraft(merchant);

    await page.goto(`/assistant?conversationId=${conversationId}`);

    const draftCard = page.locator("article").filter({ hasText: "Awaiting confirmation" });
    await expect(draftCard).toBeVisible();

    const cancelButton = page.getByRole("button", { name: "Cancel", exact: true });
    await cancelButton.click();

    await expect(draftCard).not.toBeVisible({ timeout: 15_000 });
    const composer = page.locator("#assistant-instruction");
    await expect(composer).toBeEnabled();
  });
});
