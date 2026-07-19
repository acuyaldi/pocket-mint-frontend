import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const createSource = readFileSync(
  root + "app/(app)/wallets/components/CreateWalletModal.tsx",
  "utf8",
);
const editSource = readFileSync(
  root + "app/(app)/wallets/components/EditWalletModal.tsx",
  "utf8",
);

describe("wallet form source contract", () => {
  it("offers the six supported wallet types explicitly", () => {
    for (const marker of [
      'value: "CASH"',
      'value: "BANK"',
      'value: "E_WALLET"',
      'value: "CREDIT_CARD"',
      'value: "PAYLATER"',
      'value: "LOAN"',
      'label: t("types.cash")',
      'label: t("types.creditCard")',
      'label: t("types.paylater")',
    ]) {
      expect(createSource).toContain(marker);
    }
    const createTypes = idMessages.walletModals.create.types;
    expect(createTypes.cash).toBe("Tunai");
    expect(createTypes.creditCard).toBe("Kartu Kredit");
    expect(createTypes.paylater).toBe("Paylater");
  });

  it("starts credit products at zero and asks only for credit policy fields", () => {
    expect(createSource).not.toContain("Outstanding Awal");
    expect(createSource).toContain('t("creditLimit")');
    expect(createSource).toContain('t("cutoffDate")');
    expect(createSource).toContain('t("dueDate")');
    expect(createSource).toContain('min="1"');
    expect(createSource).toContain('max="31"');
    const create = idMessages.walletModals.create;
    expect(create.creditLimit).toBe("Limit Kredit");
    expect(create.cutoffDate).toContain("Tanggal Cutoff");
    expect(create.dueDate).toContain("Tanggal Jatuh Tempo");
  });

  it("asks loans for one principal amount without a loan limit", () => {
    expect(createSource).toContain('t("loanAmount")');
    expect(createSource).not.toContain("Limit Pinjaman");
    expect(idMessages.walletModals.create.loanAmount).toBe("Nominal Pinjaman");
  });

  it("keeps wallet balances read-only in the metadata editor", () => {
    expect(editSource).not.toContain("Current Outstanding");
    expect(editSource).not.toContain('balance:');
    expect(editSource).toContain('t("creditLimit")');
    expect(editSource).toContain('t("cutoffDate")');
    expect(editSource).toContain('t("dueDate")');
    const edit = idMessages.walletModals.edit;
    expect(edit.creditLimit).toBe("Limit Kredit");
    expect(edit.cutoffDate).toBe("Tanggal Cutoff");
    expect(edit.dueDate).toBe("Tanggal Jatuh Tempo");
  });
});
