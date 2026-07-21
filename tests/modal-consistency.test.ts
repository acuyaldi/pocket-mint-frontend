import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(root + path, "utf8");

const deleteTxSource = read("app/(app)/transactions/components/DeleteTransactionModal.tsx");
const payBillSource = read("app/(app)/tagihan/components/PayBillModal.tsx");
const deleteWalletSource = read("app/(app)/wallets/components/DeleteWalletModal.tsx");
const deleteRecurringSource = read(
  "app/(app)/transactions/rutin/components/DeleteRecurringModal.tsx",
);
const archiveGoalSource = read(
  "app/(app)/target-tabungan/components/ArchiveSavingGoalModal.tsx",
);

describe("delete transaction modal consistency", () => {
  it("is an accessible alertdialog rendered through the shared AppModal shell", () => {
    // Title/description association (aria-labelledby/aria-describedby) and
    // focus trapping are owned by the underlying Dialog primitive now — see
    // components/ui/dialog.tsx and modal-primitives.test.ts.
    expect(deleteTxSource).toContain('role="alertdialog"');
    expect(deleteTxSource).toContain("title={t(\"title\")}");
    expect(deleteTxSource).toContain("description={t(\"description\")}");
  });

  it("supports Escape only while no delete is in flight", () => {
    // Escape/backdrop/close-button dismissal is handled once inside AppModal
    // (see modal-primitives.test.ts); this modal only has to wire the guard.
    expect(deleteTxSource).toContain("isPending={isDeleting}");
  });

  it("uses the shared destructive ModalSubmitButton variant instead of one-off inline styling", () => {
    expect(deleteTxSource).toContain('variant="destructive"');
    expect(deleteTxSource).not.toContain('style={{ backgroundColor: "var(--color-destructive)", color: "var(--color-destructive-foreground)" }}');
  });

  it("shows a visible, retryable error when the delete mutation fails instead of only closing or logging", () => {
    expect(deleteTxSource).toContain("const [error, setError] = useState(\"\");");
    expect(deleteTxSource).toContain("catch (err)");
    expect(deleteTxSource).toContain('setError(message ?? t("genericError"))');
    expect(deleteTxSource).toContain("<FormErrorMessage message={error} />");
    expect(idMessages.transactionModals.delete.genericError).toBe("Transaksi gagal dihapus. Coba lagi.");
    expect(enMessages.transactionModals.delete.genericError).toBeTruthy();
  });
});

describe("pay bill modal consistency", () => {
  it("guards dismissal (Escape/backdrop/close button) so a pending payment can't be dismissed mid-flight", () => {
    expect(payBillSource).toContain("isPending={payBill.isPending}");
    expect(payBillSource).toContain("if (!payBill.isPending) onClose();");
  });

  it("uses the shared modal footer buttons instead of raw buttons", () => {
    expect(payBillSource).toContain('from "@/components/ui/app-modal"');
    expect(payBillSource).toContain("<ModalCancelButton isPending={payBill.isPending} onClick={handleClose}>");
    expect(payBillSource).toContain("<ModalSubmitButton");
  });
});

describe("destructive/archive confirmation dismissal guard", () => {
  it("wires the pending guard into the shared AppModal shell instead of a bespoke Escape listener", () => {
    for (const [source, guardVar] of [
      [deleteWalletSource, "isDeleting"],
      [deleteRecurringSource, "isDeleting"],
      [archiveGoalSource, "isArchiving"],
    ] as const) {
      expect(source).toContain(`isPending={${guardVar}}`);
      expect(source).toContain(`if (!${guardVar}) onClose();`);
    }
  });
});
