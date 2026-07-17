import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/(app)/tagihan/page.tsx", "utf8");
const card = readFileSync(root + "app/(app)/tagihan/components/BillCard.tsx", "utf8");
const modal = readFileSync(root + "app/(app)/tagihan/components/PayBillModal.tsx", "utf8");

describe("Cicilan page source contract", () => {
  it("renders full and installment bills with one card", () => {
    expect(page).toContain("useBills()");
    expect(page).toContain("<BillCard");
    expect(card).toContain('bill.kind === "FULL"');
    expect(card).toContain("Satu kali bayar");
    expect(card).toContain("Cicilan");
    expect(card).toContain("bill.nextDueDate");
    expect(card).toContain("bill.paidTerms");
  });

  it("pays bills from cash, bank, or e-wallet", () => {
    expect(modal).toContain("ASSET_WALLET_TYPES.includes(wallet.type)");
    expect(modal).toContain("Saldo tidak mencukupi");
    expect(modal).toContain("usePayBill()");
  });
});
