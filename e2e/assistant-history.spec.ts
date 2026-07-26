import { test, expect } from "@playwright/test";
import {
  cancelDraftViaApi,
  ensureTestWallet,
  getExpenseCategory,
  getTestAccessToken,
  seedAssistantDraft,
} from "./helpers/backend";

/**
 * Seeds real conversations via `/assistant/execute` (no LLM) and exercises
 * the actual history list/switch UI against them. Pagination ("Load more")
 * isn't exercised here — it needs enough real conversations to cross a real
 * backend page boundary, which isn't reliable to seed deterministically
 * without depending on the page-size constant; see the phase report for why
 * that scenario stays manual-QA only in this pass.
 */
async function seedResolvedConversation(merchant: string) {
  const token = await getTestAccessToken();
  const wallet = await ensureTestWallet(token);
  const category = await getExpenseCategory(token);
  const result = await seedAssistantDraft(token, { walletName: wallet.name, categoryId: category.id, merchant });
  if (result.status !== "success") throw new Error("Expected a draft from the fixture wallet/category.");
  const draftId = (result.data as { draftId: string }).draftId;
  await cancelDraftViaApi(token, draftId);
  return result.conversationId;
}

async function seedPendingConversation(merchant: string) {
  const token = await getTestAccessToken();
  const wallet = await ensureTestWallet(token);
  const category = await getExpenseCategory(token);
  const result = await seedAssistantDraft(token, { walletName: wallet.name, categoryId: category.id, merchant });
  if (result.status !== "success") throw new Error("Expected a draft from the fixture wallet/category.");
  return result.conversationId;
}

test.describe("Assistant — conversation history and switching", () => {
  test("lists conversations, marks the active one, and switches cleanly", async ({ page }) => {
    await seedResolvedConversation(`Test Noodle Shop A ${Date.now()}`);
    const secondId = await seedResolvedConversation(`Test Noodle Shop B ${Date.now()}`);

    await page.goto(`/assistant?conversationId=${secondId}`);
    await page.getByRole("button", { name: "Open conversation history" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Conversation history" })).toBeVisible();

    const list = dialog.getByRole("list", { name: "Previous conversations" });
    await expect(list.getByRole("listitem")).not.toHaveCount(0);

    // The active conversation must be marked programmatically (aria-current), not by color alone.
    const activeItem = list.locator('button[aria-current="true"]');
    await expect(activeItem).toHaveCount(1);

    const otherItem = list.locator("button:not([aria-current])").first();
    await otherItem.click();

    await expect(dialog).not.toBeVisible();
    // Some other (non-active) history entry — the test user's history may
    // contain more than the two seeded here. Proves the switch actually
    // happened, without pinning to a specific fixture id.
    await expect(page).not.toHaveURL(new RegExp(`conversationId=${secondId}$`));
    await expect(page).toHaveURL(/conversationId=\w+/);
  });

  test("new conversation clears conversationId and shows the empty state", async ({ page }) => {
    const conversationId = await seedResolvedConversation(`Test Noodle Shop ${Date.now()}`);
    await page.goto(`/assistant?conversationId=${conversationId}`);

    await page.getByRole("button", { name: "Open conversation history" }).click();
    await page.getByRole("button", { name: "New conversation" }).click();

    await expect(page).toHaveURL(/\/assistant$/);
    await expect(page.getByText("Start a new conversation")).toBeVisible();
  });

  test("switching away from an unresolved draft is protected, not silent", async ({ page }) => {
    const activeId = await seedPendingConversation(`Test Noodle Shop C ${Date.now()}`);
    // A second history entry to switch to — the pending draft above is what's under test.
    await seedResolvedConversation(`Test Noodle Shop D ${Date.now()}`);

    await page.goto(`/assistant?conversationId=${activeId}`);
    await expect(page.locator("article").filter({ hasText: "Awaiting confirmation" })).toBeVisible();

    await page.getByRole("button", { name: "Open conversation history" }).click();
    const dialog = page.getByRole("dialog");
    const list = dialog.getByRole("list", { name: "Previous conversations" });
    await list.locator("button:not([aria-current])").first().click();

    // Blocked: a confirmation dialog appears instead of switching silently.
    await expect(dialog.getByRole("heading", { name: "Switch conversations?" })).toBeVisible();

    // "Stay here" keeps the current unresolved draft intact — it returns to
    // the conversation list within the same dialog, it doesn't close it.
    await dialog.getByRole("button", { name: "Stay here" }).click();
    await expect(dialog.getByRole("heading", { name: "Conversation history" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`conversationId=${activeId}`));
    await expect(page.locator("article").filter({ hasText: "Awaiting confirmation" })).toBeVisible();
  });
});
