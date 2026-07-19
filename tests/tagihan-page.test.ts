import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/(app)/tagihan/page.tsx", "utf8");
const card = readFileSync(root + "app/(app)/tagihan/components/BillCard.tsx", "utf8");
const modal = readFileSync(root + "app/(app)/tagihan/components/PayBillModal.tsx", "utf8");

describe("Cicilan page source contract", () => {
  it("renders full and installment bills with one card", () => {
    expect(page).toContain("useBills()");
    expect(page).toContain("<BillCard");
    expect(card).toContain('bill.kind === "FULL"');
    expect(card).toContain('t("oneTime")');
    expect(card).toContain('t("installment")');
    expect(card).toContain("bill.nextDueDate");
    expect(card).toContain("bill.paidTerms");
    expect(idMessages.tagihan.card.oneTime).toBe("Satu kali bayar");
    expect(idMessages.tagihan.card.installment).toBe("Cicilan");
  });

  it("pays bills from cash, bank, or e-wallet", () => {
    expect(modal).toContain("ASSET_WALLET_TYPES.includes(wallet.type)");
    expect(modal).toContain('t("insufficientBalance")');
    expect(modal).toContain("usePayBill()");
    expect(idMessages.tagihan.payModal.insufficientBalance).toBe(
      "Saldo tidak mencukupi"
    );
  });
});
