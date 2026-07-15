import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(
  root + "app/(app)/transactions/components/AccountPicker.tsx",
  "utf8",
);
const modalSource = readFileSync(
  root + "app/(app)/transactions/components/AddTransactionModal.tsx",
  "utf8",
);

describe("transfer account picker source contract", () => {
  it("uses existing dropdown primitives and an input-like trigger", () => {
    for (const marker of [
      "DropdownMenuTrigger",
      "DropdownMenuContent",
      "DropdownMenuItem",
      "min-h-14",
      'aria-haspopup="menu"',
      "data-open:animate-none",
    ]) {
      expect(source).toContain(marker);
    }
  });

  it("makes selected and disabled states more than color-only", () => {
    for (const marker of [
      'role="menuitemradio"',
      "aria-checked={selected}",
      "disabled={disabled}",
      "<Check",
      "disabledReason",
      "border-border/60",
      "bg-surface-low",
    ]) {
      expect(source).toContain(marker);
    }
  });

  it("keeps balances complete and readable", () => {
    expect(source).toContain("formatWalletAmount");
    expect(source).toContain("tabular-nums");
    expect(source).not.toContain("line-clamp");
    expect(source).not.toContain("truncate");
  });
});

describe("add transaction modal transfer flow source contract", () => {
  it("offers exactly three transaction types", () => {
    expect(modalSource).not.toContain("PAY_DEBT");
    expect(modalSource).not.toContain("Bayar hutang");
    expect(modalSource).not.toContain("Bayar Hutang");
    expect(modalSource).toContain("grid-cols-3");
  });

  it("uses a sequential picker flow instead of transfer wallet cards", () => {
    expect(modalSource).not.toContain("WalletGrid");
    expect(modalSource).toContain("<AccountPicker");
    expect(modalSource).toContain(
      'aria-label="Tukar dompet sumber dan tujuan"',
    );

    const indices = [
      "<FieldLabel>Jumlah</FieldLabel>",
      "<FieldLabel>Tanggal</FieldLabel>",
      'id="transfer-source"',
      'aria-label="Tukar dompet sumber dan tujuan"',
      'id="transfer-destination"',
      "<FieldLabel>Deskripsi</FieldLabel>",
    ].map((marker) => modalSource.indexOf(marker));

    expect(indices.every((index) => index >= 0)).toBe(true);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("wires transfer selection, swapping, validation, and source balance", () => {
    for (const marker of [
      "selectTransferEndpoint(",
      "swapTransferEndpoints(",
      "isValidTransferPair(",
      "Saldo tidak cukup",
    ]) {
      expect(modalSource).toContain(marker);
    }
  });
});
