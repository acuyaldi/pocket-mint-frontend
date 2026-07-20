import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const modalSource = readFileSync(
  root + "app/(app)/wallets/components/CreateWalletModal.tsx",
  "utf8",
);
const pageSource = readFileSync(root + "app/(app)/wallets/page.tsx", "utf8");

describe("create wallet mutation feedback", () => {
  it("owns a pending prop and disables both actions while creating", () => {
    expect(modalSource).toContain("isCreating: boolean");
    expect(modalSource).toContain('<Button type="submit" disabled={isCreating}');
    expect(modalSource).toContain("onClick={handleClose}");
    expect(modalSource).toContain("disabled={isCreating}");
  });

  it("shows a visible loading label instead of a static submit label while pending", () => {
    expect(modalSource).toContain("isCreating ? (");
    expect(modalSource).toContain("Loader2");
    expect(modalSource).toContain('tCommon("actions.saving")');
  });

  it("awaits the submit, displays the error inline, and keeps the modal open on failure", () => {
    expect(modalSource).toContain("onSubmit: (data: CreateWalletFormData) => Promise<void>");
    expect(modalSource).toContain("try {");
    expect(modalSource).toContain("await onSubmit({");
    expect(modalSource).toContain('setError(message ?? t("genericError"))');
    expect(idMessages.walletModals.create.genericError).toBe("Akun gagal ditambahkan. Coba lagi.");
    expect(enMessages.walletModals.create.genericError).toBeTruthy();
  });

  it("only resets and closes the form after a successful submit", () => {
    const submitMatch = modalSource.match(/const handleSubmit = async \(event: FormEvent\) => \{([\s\S]*?)\n  \};/);
    expect(submitMatch, "expected handleSubmit").toBeTruthy();
    const body = submitMatch![1];
    const catchIndex = body.indexOf("catch (caught)");
    const resetIndex = body.indexOf("resetForm();");
    expect(catchIndex).toBeGreaterThan(-1);
    expect(resetIndex).toBeGreaterThan(catchIndex);
  });

  it("guards close-while-pending so a mid-request dismissal can't drop the form", () => {
    expect(modalSource).toContain("if (isCreating) return;");
  });

  it("wires the mutation's own pending/error state through from the page instead of firing-and-forgetting", () => {
    expect(pageSource).toContain("isCreating={createWallet.isPending}");
    expect(pageSource).toContain("onSubmit={handleWalletCreateSubmit}");
    expect(pageSource).toContain("throw error;");
  });
});
