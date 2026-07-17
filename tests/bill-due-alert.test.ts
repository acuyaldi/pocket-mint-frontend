import { describe, expect, it } from "vitest";

import { countDueSoon, type BillDto } from "@/src/features/bills/hooks/useBills";

function bill(
  id: string,
  nextDueDate: string,
  status: BillDto["status"] = "ACTIVE",
): BillDto {
  return {
    id,
    transactionId: null,
    kind: "FULL",
    description: id,
    walletId: "credit-1",
    walletName: "Kartu",
    walletType: "CREDIT_CARD",
    amountPerTerm: 100_000,
    currentTerm: 1,
    totalTerms: 1,
    paidTerms: 0,
    nextDueDate,
    totalAmount: 100_000,
    grandTotal: 100_000,
    totalInterest: 0,
    interestRate: 0,
    status,
    startDate: "2026-07-01T00:00:00.000Z",
  };
}

describe("countDueSoon", () => {
  it("includes overdue, today, and the third local calendar day", () => {
    const bills = [
      bill("overdue", "2026-07-10T00:00:00.000Z", "OVERDUE"),
      bill("today", "2026-07-17T00:00:00.000Z"),
      bill("third-day", "2026-07-20T00:00:00.000Z"),
      bill("fourth-day", "2026-07-21T00:00:00.000Z"),
      bill("settled", "2026-07-18T00:00:00.000Z", "SETTLED"),
    ];

    expect(countDueSoon(bills, "2026-07-17", 3)).toBe(3);
  });

  it("returns zero for an empty list", () => {
    expect(countDueSoon([], "2026-07-17", 3)).toBe(0);
  });

  it("normalizes UTC timestamps to the Jakarta calendar day", () => {
    const fourthJakartaDay = bill(
      "fourth-jakarta-day",
      "2026-07-20T17:00:00.000Z",
    );

    expect(countDueSoon([fourthJakartaDay], "2026-07-17", 3)).toBe(0);
  });
});
