import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AccountPicker,
  type AccountPickerProps,
} from "@/app/(app)/transactions/components/AccountPicker";
import messages from "@/messages/id.json";
import type { Wallet } from "@/src/types/wallet";

const bankWallet: Wallet = {
  id: "bank",
  userId: "user-1",
  name: "BCA Debit",
  type: "BANK",
  balance: 1_234_567,
  creditLimit: 0,
  interestRate: 0,
  currency: "IDR",
  isArchived: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderPicker(overrides: Partial<AccountPickerProps> = {}) {
  return renderToStaticMarkup(
    React.createElement(NextIntlClientProvider, {
      locale: "id",
      messages,
      children: React.createElement(AccountPicker, {
        id: "transfer-source",
        label: "Dompet sumber",
        wallets: [bankWallet],
        selectedId: "bank",
        emptyLabel: "Pilih dompet sumber",
        onSelect: () => undefined,
        ...overrides,
      }),
    }),
  );
}

describe("AccountPicker closed trigger", () => {
  it("includes the selected wallet value in its accessible naming relationship", () => {
    const markup = renderPicker();

    expect(markup).toContain(
      'aria-labelledby="transfer-source-label transfer-source-value"',
    );
    expect(markup).toContain('id="transfer-source-value"');
    expect(markup).toContain("BCA Debit");
    expect(markup).toContain("Rp 1.234.567");
  });

  it("uses the prompt as the accessible value when no wallet is selected", () => {
    const markup = renderPicker({ selectedId: "" });

    expect(markup).toContain('id="transfer-source-value"');
    expect(markup).toContain("Pilih dompet sumber");
  });
});
