import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

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
    expect(modalSource).toContain('<option value="" disabled hidden>');
    expect(modalSource).toContain("!categoryId");
    expect(modalSource).toContain("Pilih kategori.");
  });

  it("supports full and installment billing for every positive credit purchase", () => {
    expect(modalSource).toContain('? "INSTALLMENT"');
    expect(modalSource).toContain(': "FULL"');
    expect(modalSource).toContain("isCreditWallet(selectedWallet.type)");
    expect(modalSource).toContain("Satu kali bayar");
    expect(modalSource).toContain("Cicilan");
    expect(modalSource).not.toContain("500000");
  });

  it("uses remaining credit and asks for a manual due date when cycle data is incomplete", () => {
    expect(modalSource).toContain("remainingCredit");
    expect(modalSource).toContain("wallet.creditLimit");
    expect(modalSource).toContain("firstDueDate");
    expect(modalSource).toContain("needsManualDueDate");
    expect(modalSource).toContain("Jatuh tempo pertama");
  });

  it("uses separate transfer source and destination policies", () => {
    expect(modalSource).toContain("getTransferSources(wallets)");
    expect(modalSource).toContain("getTransferDestinations(wallets, walletId)");
    expect(modalSource).toContain('disabledReason="Saldo tidak mencukupi"');
  });
});
