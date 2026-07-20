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
  it("is an accessible alertdialog with a titled/described region", () => {
    expect(deleteTxSource).toContain('role="alertdialog"');
    expect(deleteTxSource).toContain('aria-modal="true"');
    expect(deleteTxSource).toContain('aria-labelledby="delete-tx-title"');
    expect(deleteTxSource).toContain('aria-describedby="delete-tx-description"');
    expect(deleteTxSource).toContain('id="delete-tx-title"');
    expect(deleteTxSource).toContain('id="delete-tx-description"');
  });

  it("supports Escape only while no delete is in flight", () => {
    expect(deleteTxSource).toContain('if (e.key === "Escape") onClose();');
    expect(deleteTxSource).toContain("if (!isOpen || isDeleting) return;");
  });

  it("uses the shared destructive Button variant instead of one-off inline styling", () => {
    expect(deleteTxSource).toContain('variant="destructive"');
    expect(deleteTxSource).not.toContain('style={{ backgroundColor: "var(--color-destructive)", color: "var(--color-destructive-foreground)" }}');
  });

  it("shows a visible, retryable error when the delete mutation fails instead of only closing or logging", () => {
    expect(deleteTxSource).toContain("const [error, setError] = useState(\"\");");
    expect(deleteTxSource).toContain("catch (err)");
    expect(deleteTxSource).toContain('setError(message ?? t("genericError"))');
    expect(idMessages.transactionModals.delete.genericError).toBe("Transaksi gagal dihapus. Coba lagi.");
    expect(enMessages.transactionModals.delete.genericError).toBeTruthy();
  });
});

describe("pay bill modal consistency", () => {
  it("guards the backdrop and close button so a pending payment can't be dismissed mid-flight", () => {
    expect(payBillSource).toContain("if (!payBill.isPending) onClose();");
    expect(payBillSource).toContain("onClick={handleClose}");
    expect(payBillSource).not.toContain("onClick={onClose}");
  });

  it("supports Escape only while no payment is in flight", () => {
    expect(payBillSource).toContain('if (e.key === "Escape") onClose();');
    expect(payBillSource).toContain("if (payBill.isPending) return;");
  });

  it("uses the shared Button component in its footer instead of raw buttons", () => {
    expect(payBillSource).toContain('import { Button } from "@/components/ui/button";');
    expect(payBillSource).toContain("<Button type=\"button\" variant=\"outline\" onClick={handleClose}");
    expect(payBillSource).toContain("<Button type=\"button\" onClick={handlePay}");
  });
});

describe("destructive confirmation Escape support", () => {
  it("adds guarded Escape handling to delete/archive confirmations that previously lacked it", () => {
    for (const [source, guardVar] of [
      [deleteWalletSource, "isDeleting"],
      [deleteRecurringSource, "isDeleting"],
      [archiveGoalSource, "isArchiving"],
    ] as const) {
      expect(source).toContain('if (e.key === "Escape") onClose();');
      expect(source).toContain(`|| ${guardVar}) return;`);
    }
  });
});
