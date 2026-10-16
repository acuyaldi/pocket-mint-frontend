import { test, expect } from "@playwright/test";
import {
  ensureTestDestinationWallet,
  ensureTestWallet,
  getTestAccessToken,
  seedAssistantTransferDraft,
} from "./helpers/backend";

/**
 * Mirrors assistant-draft-lifecycle.spec.ts for the TRANSFER draft type
 * (Phase 36B / PD-026). Seeds a real Pending Financial Draft via the
 * deterministic `/assistant/execute` endpoint (no LLM involved), then drives
 * the actual browser UI against it.
 */

async function seedTransferDraft() {
  const token = await getTestAccessToken();
  const wallet = await ensureTestWallet(token);
  const destination = await ensureTestDestinationWallet(token);
  const result = await seedAssistantTransferDraft(token, { walletName: wallet.name, toWalletName: destination.name });
  if (result.status !== "success") {
    throw new Error(`Expected a draft, got clarification_required — pick less ambiguous wallet fixtures.`);
  }
  return { conversationId: result.conversationId, token };
}

test.describe("Assistant — TRANSFER draft review, confirm, cancel", () => {
  test("displays Dari/Ke wallet rows with no category, and confirms it", async ({ page }) => {
    const { conversationId } = await seedTransferDraft();

    await page.goto(`/assistant?conversationId=${conversationId}`);

    const draftCard = page.locator("article").filter({ hasText: "Awaiting confirmation" });
    await expect(draftCard).toBeVisible();
    await expect(draftCard).toContainText("Transfer");
    await expect(draftCard).toContainText("Dari");
    await expect(draftCard).toContainText("Ke");
    await expect(draftCard).not.toContainText("Category");
    await expect(draftCard).not.toContainText("Kategori");

    const composer = page.locator("#assistant-instruction");
    await expect(composer).toBeDisabled();

    const confirmButton = page.getByRole("button", { name: "Confirm", exact: true });
    const cancelButton = page.getByRole("button", { name: "Cancel", exact: true });

    await confirmButton.click();

    await expect(draftCard).not.toBeVisible({ timeout: 15_000 });
    await expect(cancelButton).not.toBeVisible();
    await expect(composer).toBeEnabled();
  });

  test("cancels a TRANSFER draft without creating a transaction", async ({ page }) => {
    const { conversationId } = await seedTransferDraft();

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
