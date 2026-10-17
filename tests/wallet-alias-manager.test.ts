import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const managerSource = readFileSync(
  root + "app/(app)/wallets/components/WalletAliasManager.tsx",
  "utf8",
);
const editSource = readFileSync(
  root + "app/(app)/wallets/components/EditWalletModal.tsx",
  "utf8",
);
const hookSource = readFileSync(root + "src/features/wallets/hooks/useWallets.ts", "utf8");

describe("wallet alias manager (Phase 37)", () => {
  it("is presentational — mutations are owned by the caller, not a hook called inside it", () => {
    expect(managerSource).not.toContain("useCreateWalletAlias");
    expect(managerSource).not.toContain("useDeleteWalletAlias");
    expect(managerSource).toContain("onAdd: (aliasDisplay: string) => Promise<void>");
    expect(managerSource).toContain("onRemove: (aliasId: string) => Promise<void>");
  });

  it("trims and ignores an empty draft before calling onAdd", () => {
    expect(managerSource).toContain("const aliasDisplay = draft.trim();");
    expect(managerSource).toContain("if (!aliasDisplay) return;");
  });

  it("bounds the alias input client-side, matching the server's per-alias byte budget", () => {
    expect(managerSource).toContain("maxLength={ALIAS_INPUT_MAX_LENGTH}");
    expect(managerSource).toMatch(/ALIAS_INPUT_MAX_LENGTH\s*=\s*\d+/);
  });

  it("clears the draft only after a successful add, and surfaces the server error otherwise", () => {
    expect(managerSource).toContain("await onAdd(aliasDisplay);");
    expect(managerSource).toContain("setDraft(\"\");");
    expect(managerSource).toContain("setError(getApiErrorMessage(caught) ?? t(\"genericError\"));");
  });

  it("gives every alias a removable chip with an accessible, name-specific label", () => {
    expect(managerSource).toContain('aria-label={t("removeAria", { name: alias.aliasDisplay })}');
    expect(managerSource).toContain("aria-busy={isRemoving}");
    expect(managerSource).toContain("disabled={isRemoving}");
  });

  it("shows a distinct empty state instead of an empty list", () => {
    expect(managerSource).toContain('{t("empty")}');
  });

  it("never claims fuzzy matching in its copy", () => {
    for (const messages of [idMessages, enMessages]) {
      const copy = JSON.stringify(messages.walletModals.edit.aliases).toLowerCase();
      expect(copy).not.toContain("fuzzy");
      expect(copy).not.toContain("similar");
    }
  });

  it("has exact key parity between id and en for the aliases sub-namespace", () => {
    expect(Object.keys(idMessages.walletModals.edit.aliases).sort()).toEqual(
      Object.keys(enMessages.walletModals.edit.aliases).sort(),
    );
  });
});

describe("EditWalletModal wiring the alias manager (Phase 37)", () => {
  it("owns the create/delete alias mutations and passes them down as callbacks", () => {
    expect(editSource).toContain("useCreateWalletAlias");
    expect(editSource).toContain("useDeleteWalletAlias");
    expect(editSource).toContain("<WalletAliasManager");
    expect(editSource).toContain("isAdding={createAlias.isPending}");
  });

  it("tracks which alias is being removed so only that chip shows a busy state", () => {
    expect(editSource).toContain("removingAliasId");
    expect(editSource).toContain("setRemovingAliasId(aliasId);");
    expect(editSource).toContain("setRemovingAliasId(null);");
  });

  it("renders the alias manager outside the wallet-save form (no nested <form>)", () => {
    const formOpenIndex = editSource.indexOf('<form id="edit-wallet-form"');
    const formCloseIndex = editSource.indexOf("</form>");
    const managerIndex = editSource.indexOf("<WalletAliasManager");
    expect(formOpenIndex).toBeGreaterThan(-1);
    expect(managerIndex).toBeGreaterThan(formCloseIndex);
  });

  it("keeps wallet selects/edit canonical-name-only — aliases never replace the name field", () => {
    expect(editSource).toContain('<FormField label={t("accountName")} htmlFor="edit-wallet-name">');
  });
});

describe("wallet alias hooks (Phase 37)", () => {
  it("expose a create and a delete hook, no update — delete and recreate is intentional", () => {
    expect(hookSource).toContain("export const useCreateWalletAlias = ()");
    expect(hookSource).toContain("export const useDeleteWalletAlias = ()");
    expect(hookSource).not.toContain("useUpdateWalletAlias");
  });

  it("hit the nested alias routes and invalidate wallet-dependent queries on success", () => {
    expect(hookSource).toContain("`/wallets/${walletId}/aliases`");
    expect(hookSource).toContain("`/wallets/${walletId}/aliases/${aliasId}`");
    const createIdx = hookSource.indexOf("useCreateWalletAlias");
    const deleteIdx = hookSource.indexOf("useDeleteWalletAlias");
    expect(hookSource.indexOf("invalidateWalletDependents(queryClient)", createIdx)).toBeGreaterThan(createIdx);
    expect(hookSource.indexOf("invalidateWalletDependents(queryClient)", deleteIdx)).toBeGreaterThan(deleteIdx);
  });
});
