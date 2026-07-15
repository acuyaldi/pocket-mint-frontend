import { describe, expect, it } from "vitest";

import {
  getTransferWallets,
  isValidTransferPair,
  selectTransferEndpoint,
  swapTransferEndpoints,
} from "@/app/(app)/transactions/components/transfer-account-picker";
import type { Wallet, WalletType } from "@/src/types/wallet";

function wallet(id: string, type: WalletType): Wallet {
  return {
    id,
    userId: "user-1",
    name: id,
    type,
    balance: 0,
    creditLimit: 0,
    interestRate: 0,
    currency: "IDR",
    isArchived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("transfer account picker state", () => {
  it("filters debt wallets while preserving eligible wallet order", () => {
    const wallets = [
      wallet("bank", "BANK"),
      wallet("credit", "CREDIT_CARD"),
      wallet("cash", "CASH"),
      wallet("paylater", "LOAN_PAYLATER"),
      wallet("ewallet", "E_WALLET"),
    ];

    expect(getTransferWallets(wallets).map(({ id }) => id)).toEqual([
      "bank",
      "cash",
      "ewallet",
    ]);
  });

  it("selects an unused wallet without changing the opposite endpoint", () => {
    expect(selectTransferEndpoint("bank", "cash", "ewallet")).toEqual({
      selectedId: "ewallet",
      oppositeId: "cash",
    });
  });

  it("exchanges endpoints when selecting the opposite wallet", () => {
    expect(selectTransferEndpoint("bank", "cash", "cash")).toEqual({
      selectedId: "cash",
      oppositeId: "bank",
    });
  });

  it("swaps endpoints without inventing a default for an empty ID", () => {
    expect(swapTransferEndpoints("bank", "")).toEqual({
      selectedId: "",
      oppositeId: "bank",
    });
  });

  it("validates that both transfer endpoint IDs are non-empty and different", () => {
    expect(isValidTransferPair("bank", "cash")).toBe(true);
    expect(isValidTransferPair("bank", "bank")).toBe(false);
    expect(isValidTransferPair("bank", "")).toBe(false);
    expect(isValidTransferPair("", "cash")).toBe(false);
  });
});
