import { test, expect } from "@playwright/test";
import {
  deleteWalletAlias,
  ensureTestWallet,
  findWalletAliasId,
  getExpenseCategory,
  getTestAccessToken,
  seedAssistantDraft,
} from "./helpers/backend";

/**
 * Phase 37 (PD-027): proves the explicit wallet-alias feature end to end —
 * an alias created through the real wallet UI is accepted by Assistant
 * transaction capture as an exact match, resolving the wallet without a
 * clarification step. The alias is created in the browser (the actual
 * surface under test); the draft is seeded through the deterministic
 * `/assistant/execute` endpoint (no LLM) exactly like the other specs in
 * this suite, both to avoid flaking on live-NL parsing and because entity
 * resolution — not message parsing — is what Phase 37 actually changes.
 * The draft is cancelled, never confirmed: no production transaction is
 * created by this test.
 */
test.describe("Assistant — wallet alias capture (Phase 37)", () => {
  test("an alias added via the wallet UI resolves Assistant capture without clarification", async ({ page }) => {
    const token = await getTestAccessToken();
    const wallet = await ensureTestWallet(token);
    const category = await getExpenseCategory(token);
    const aliasText = `E2E Alias ${Date.now()}`;

    try {
      // 1. Create the alias through the real wallet UI.
      await page.goto("/wallets");
      await page
        .getByRole("button", { name: `${wallet.name} account menu` })
        .click();
      await page.getByRole("menuitem", { name: "Edit Account" }).click();

      const modal = page.getByRole("dialog", { name: "Edit Account" });
      await expect(modal).toBeVisible();
      await modal.getByLabel("Also known as", { exact: true }).fill(aliasText);
      await modal.getByRole("button", { name: "Add", exact: true }).click();

      const aliasChip = modal.getByText(aliasText, { exact: true });
      await expect(aliasChip).toBeVisible({ timeout: 10_000 });

      await modal.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(modal).not.toBeVisible();

      // 2. Submit an Assistant capture using ONLY the alias text as the
      // wallet reference — never the canonical wallet name.
      const merchant = `Test Noodle Shop ${Date.now()}`;
      const result = await seedAssistantDraft(token, {
        walletName: aliasText,
        categoryId: category.id,
        merchant,
      });
      expect(result.status, "expected the alias to resolve the wallet directly, not require clarification").toBe("success");

      // 3. Confirm the real UI renders the draft as fully resolved — no
      // wallet clarification prompt — then cancel without confirming it.
      await page.goto(`/assistant?conversationId=${result.conversationId}`);
      const draftCard = page.locator("article").filter({ hasText: "Awaiting confirmation" });
      await expect(draftCard).toBeVisible();
      await expect(draftCard).toContainText("Expense");
      await expect(page.getByText(/which wallet/i)).not.toBeVisible();

      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(draftCard).not.toBeVisible({ timeout: 15_000 });
    } finally {
      // Cleanup: delete the alias so repeated runs never approach the
      // per-wallet alias cap on this shared fixture wallet.
      const aliasId = await findWalletAliasId(token, wallet.id, aliasText);
      if (aliasId) await deleteWalletAlias(token, wallet.id, aliasId);
    }
  });
});
