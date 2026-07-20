import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const modalSource = readFileSync(
  root + "app/(app)/transactions/components/EditTransactionModal.tsx",
  "utf8",
);
const pageSource = readFileSync(root + "app/(app)/transactions/page.tsx", "utf8");
const panelSource = readFileSync(
  root + "app/(app)/transactions/components/TransactionDetailPanel.tsx",
  "utf8",
);

describe("edit transaction modal re-hydration", () => {
  it("re-syncs every editable field from the selected transaction, not just once at mount", () => {
    // Every field must be plain state (not initialized from `tx` directly),
    // otherwise the initial value freezes to whatever `tx` was on first mount.
    expect(modalSource).toContain('useState("")');
    expect(modalSource).not.toContain("useState(tx?.description");
    expect(modalSource).not.toContain("useState(tx ? formatRupiah");
    expect(modalSource).not.toContain('useState<"EXPENSE" | "INCOME">(\n    tx?.type');

    // The sync must set all four editable fields plus clear stale error
    // state, keyed off the transaction *object* itself (not just tx?.id) so
    // a same-id data change also re-syncs. It runs in a useEffect keyed on
    // [tx] (an explicit, external-prop synchronization), not during render.
    const syncMatch = modalSource.match(/useEffect\(\(\) => \{\s*if \(!tx\) return;([\s\S]*?)\}, \[tx\]\);/);
    expect(syncMatch, "expected a useEffect sync keyed on [tx]").toBeTruthy();
    const syncBody = syncMatch![1];
    expect(syncBody).toContain("setDescription(tx.description");
    expect(syncBody).toContain("setAmount(formatRupiah(String(tx.amount)))");
    expect(syncBody).toContain('setType(tx.type === "INCOME" ? "INCOME" : "EXPENSE")');
    expect(syncBody).toContain("setDate(tx.date ? tx.date.slice(0, 10) : \"\")");
    expect(syncBody).toContain('setError("")');
  });

  it("keeps mutation error and pending UI local to the currently open transaction", () => {
    expect(modalSource).toContain("const [error, setError] = useState(\"\");");
    expect(modalSource).toContain("catch (err)");
    expect(modalSource).toContain("setError(message ?? t(\"genericSaveFailed\"))");
    expect(idMessages.transactionModals.edit.genericSaveFailed).toBe(
      "Perubahan gagal disimpan. Coba lagi.",
    );
    expect(enMessages.transactionModals.edit.genericSaveFailed).toBeTruthy();
  });

  it("disables submit and guards close while a save is pending", () => {
    expect(modalSource).toContain("disabled={isSaving}");
    expect(modalSource).toContain("if (!isSaving) onClose()");
  });

  it("submits the currently displayed values without touching category/wallet/installment relations", () => {
    expect(modalSource).toContain("id: tx.id");
    expect(modalSource).toContain("description: description.trim()");
    expect(modalSource).toContain("amount: parsedAmount");
    expect(modalSource).not.toContain("categoryId");
    expect(modalSource).not.toContain("walletId");
    expect(modalSource).not.toContain("isInstallment");
  });

  it("rethrows update failures from the page so the modal can display them instead of closing", () => {
    const handlerMatch = pageSource.match(/const handleEditSubmit = useCallback\(([\s\S]*?)\[updateTransaction\],\s*\);/);
    expect(handlerMatch, "expected handleEditSubmit callback").toBeTruthy();
    const handlerBody = handlerMatch![1];
    expect(handlerBody).toContain("catch (error)");
    expect(handlerBody).toContain("throw error;");
    // setEditingTx(null) only runs on the success path, above the catch.
    expect(handlerBody.indexOf("setEditingTx(null)")).toBeLessThan(handlerBody.indexOf("catch (error)"));
  });

  it("blocks editing transfer and installment-linked transactions at the single entry point", () => {
    expect(panelSource).toContain(
      'const canEdit = !!tx && tx.type !== "TRANSFER" && !tx.isInstallment;',
    );
    expect(panelSource).toContain("if (canEdit) { onEdit(tx); onClose(); }");
    expect(panelSource).toContain("disabled={!canEdit}");
  });

  it("explains the transfer restriction as a frontend limitation, distinct from the backend-enforced installment restriction", () => {
    expect(panelSource.replace(/\r\n/g, "\n")).toContain(
      'tx?.isInstallment\n    ? t("editUnsupportedInstallment")\n    : t("editUnsupportedTransfer")',
    );
    expect(idMessages.transactionModals.detail.editUnsupportedTransfer).toBe(
      "Ubah transfer belum didukung di layar ini.",
    );
    expect(idMessages.transactionModals.detail.editUnsupportedInstallment).toBe(
      "Transaksi cicilan tidak bisa diubah langsung.",
    );
    expect(enMessages.transactionModals.detail.editUnsupportedTransfer).toBeTruthy();
    expect(enMessages.transactionModals.detail.editUnsupportedInstallment).toBeTruthy();
    // The transfer message must not claim a backend rule — it's a frontend capability gap.
    expect(idMessages.transactionModals.detail.editUnsupportedTransfer).not.toMatch(/backend|server/i);
  });
});
