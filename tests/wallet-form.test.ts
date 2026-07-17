import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

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
      'label: "Tunai"',
      'label: "Kartu Kredit"',
      'label: "Paylater"',
    ]) {
      expect(createSource).toContain(marker);
    }
  });

  it("starts credit products at zero and asks only for credit policy fields", () => {
    expect(createSource).not.toContain("Outstanding Awal");
    expect(createSource).toContain("Limit Kredit");
    expect(createSource).toContain("Tanggal Cutoff");
    expect(createSource).toContain("Tanggal Jatuh Tempo");
    expect(createSource).toContain('min="1"');
    expect(createSource).toContain('max="31"');
  });

  it("asks loans for one principal amount without a loan limit", () => {
    expect(createSource).toContain("Nominal Pinjaman");
    expect(createSource).not.toContain("Limit Pinjaman");
  });

  it("keeps wallet balances read-only in the metadata editor", () => {
    expect(editSource).not.toContain("Current Outstanding");
    expect(editSource).not.toContain('balance:');
    expect(editSource).toContain("Limit Kredit");
    expect(editSource).toContain("Tanggal Cutoff");
    expect(editSource).toContain("Tanggal Jatuh Tempo");
  });
});
