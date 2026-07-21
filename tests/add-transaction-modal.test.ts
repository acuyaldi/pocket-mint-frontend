import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const modalSource = readFileSync(
  root + "app/(app)/transactions/components/AddTransactionModal.tsx",
  "utf8",
);
const categoryHookSource = readFileSync(
  root + "src/features/categories/hooks/useCategories.ts",
  "utf8",
);

describe("add transaction source contract", () => {
  it("loads owned categories and submits their IDs", () => {
    expect(categoryHookSource).toContain("/categories");
    expect(categoryHookSource).toContain("export interface Category");
    expect(modalSource).toContain("useCategories()");
    expect(modalSource).toContain("categoryId");
    expect(modalSource).not.toContain("EXPENSE_CATS");
    expect(modalSource).not.toContain("INCOME_CATS");
  });

  it("makes the category placeholder impossible to submit", () => {
    // Placeholder hanya teks trigger dropdown, bukan item yang bisa dipilih
    expect(modalSource).toContain('t("chooseCategory")');
    expect(modalSource).toContain("!categoryId");
    expect(modalSource).toContain('t("errors.chooseCategory")');
    expect(idMessages.transactionModals.add.chooseCategory).toBe("Pilih kategori");
    expect(idMessages.transactionModals.add.errors.chooseCategory).toBe("Pilih kategori.");
  });

  it("supports full and installment billing for every positive credit purchase", () => {
    expect(modalSource).toContain('? "INSTALLMENT"');
    expect(modalSource).toContain(': "FULL"');
    expect(modalSource).toContain("isCreditWallet(selectedWallet.type)");
    expect(modalSource).toContain('t("payFull")');
    expect(modalSource).toContain('t("payInstallment")');
    expect(modalSource).not.toContain("500000");
    expect(idMessages.transactionModals.add.payFull).toBe("Satu kali bayar");
    expect(idMessages.transactionModals.add.payInstallment).toBe("Cicilan");
  });

  it("uses remaining credit and asks for a manual due date when cycle data is incomplete", () => {
    expect(modalSource).toContain("remainingCredit");
    expect(modalSource).toContain("wallet.creditLimit");
    expect(modalSource).toContain("firstDueDate");
    expect(modalSource).toContain("needsManualDueDate");
    expect(modalSource).toContain('t("firstDueDate")');
    expect(idMessages.transactionModals.add.firstDueDate).toBe("Jatuh tempo pertama");
  });

  it("uses separate transfer source and destination policies", () => {
    expect(modalSource).toContain("getTransferSources(wallets)");
    expect(modalSource).toContain("getTransferDestinations(wallets, walletId)");
    expect(modalSource).toContain('disabledReason={t("insufficientBalance")}');
    expect(idMessages.transactionModals.add.insufficientBalance).toBe("Saldo tidak mencukupi");
  });
});
