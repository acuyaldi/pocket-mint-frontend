import { describe, expect, it } from "vitest";

import {
  buildMonthlyFlow,
  filterTransactionsByPeriod,
  getJakartaMonthKey,
  getPeriodMonthKeys,
} from "@/app/(app)/analytics/period";
import type { Transaction } from "@/src/types/transaction";

function tx(
  id: string,
  type: Transaction["type"],
  amount: number,
  date: string,
): Transaction {
  return {
    id,
    userId: "user-1",
    type,
    amount,
    date,
    createdAt: date,
    updatedAt: date,
  };
}

describe("getJakartaMonthKey (PM-STAB-002 boundary/timezone)", () => {
  it("resolves the month in the reporting timezone, not raw UTC", () => {
    // 2026-04-30T17:30:00Z is already 2026-05-01T00:30 in Asia/Jakarta (UTC+7).
    expect(getJakartaMonthKey("2026-04-30T17:30:00.000Z")).toBe("2026-05");
  });

  it("keeps a UTC-morning date in the same Jakarta day/month", () => {
    expect(getJakartaMonthKey("2026-04-30T02:00:00.000Z")).toBe("2026-04");
  });
});

describe("getPeriodMonthKeys", () => {
  it("returns exactly three sequential calendar months ending at the current month", () => {
    const now = new Date("2026-07-17T05:00:00.000Z"); // 2026-07-17 12:00 WIB
    expect(getPeriodMonthKeys("quarter", now)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
  });

  it("returns exactly six sequential calendar months, not just the current one", () => {
    const now = new Date("2026-07-17T05:00:00.000Z");
    expect(getPeriodMonthKeys("six-months", now)).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
  });

  it("rolls over the year boundary correctly", () => {
    const now = new Date("2026-01-15T05:00:00.000Z"); // 2026-01-15 WIB
    expect(getPeriodMonthKeys("quarter", now)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
  });

  it("returns a single month for the 'month' period", () => {
    const now = new Date("2026-07-17T05:00:00.000Z");
    expect(getPeriodMonthKeys("month", now)).toEqual(["2026-07"]);
  });
});

describe("filterTransactionsByPeriod (PM-STAB-002 regression)", () => {
  const now = new Date("2026-07-17T05:00:00.000Z"); // reporting month: 2026-07

  it("includes transactions from three distinct months under the 3-month filter", () => {
    const transactions = [
      tx("may", "EXPENSE", 10_000, "2026-05-10T04:00:00.000Z"),
      tx("june", "INCOME", 20_000, "2026-06-10T04:00:00.000Z"),
      tx("july", "EXPENSE", 30_000, "2026-07-10T04:00:00.000Z"),
    ];

    const result = filterTransactionsByPeriod(transactions, "quarter", now);

    expect(result.map((t) => t.id).sort()).toEqual(["july", "june", "may"]);
  });

  it("excludes transactions outside the selected period", () => {
    const transactions = [
      tx("april", "EXPENSE", 10_000, "2026-04-10T04:00:00.000Z"), // outside 3-month window
      tx("july", "EXPENSE", 30_000, "2026-07-10T04:00:00.000Z"),
    ];

    const result = filterTransactionsByPeriod(transactions, "quarter", now);

    expect(result.map((t) => t.id)).toEqual(["july"]);
  });

  it("the 6-month filter is not equivalent to 'this month only'", () => {
    const transactions = [
      tx("february", "EXPENSE", 10_000, "2026-02-10T04:00:00.000Z"),
      tx("july", "EXPENSE", 30_000, "2026-07-10T04:00:00.000Z"),
    ];

    const sixMonths = filterTransactionsByPeriod(transactions, "six-months", now);
    const thisMonth = filterTransactionsByPeriod(transactions, "month", now);

    expect(sixMonths.map((t) => t.id).sort()).toEqual(["february", "july"]);
    expect(thisMonth.map((t) => t.id)).toEqual(["july"]);
  });
});

describe("buildMonthlyFlow (PM-STAB-002 regression)", () => {
  const monthKeys = ["2026-05", "2026-06", "2026-07"];

  it("produces zero — not fabricated data — for a month without transactions", () => {
    const transactions = [tx("july", "INCOME", 50_000, "2026-07-05T04:00:00.000Z")];

    const flow = buildMonthlyFlow(transactions, monthKeys);

    expect(flow).toEqual([
      { month: "2026-05", income: 0, expenses: 0 },
      { month: "2026-06", income: 0, expenses: 0 },
      { month: "2026-07", income: 50_000, expenses: 0 },
    ]);
  });

  it("accumulates income and expenses per month without double counting, and ignores transfers", () => {
    const transactions = [
      tx("inc-1", "INCOME", 100_000, "2026-06-01T04:00:00.000Z"),
      tx("inc-2", "INCOME", 50_000, "2026-06-15T04:00:00.000Z"),
      tx("exp-1", "EXPENSE", 30_000, "2026-06-20T04:00:00.000Z"),
      tx("transfer", "TRANSFER", 999_999, "2026-06-10T04:00:00.000Z"),
    ];

    const flow = buildMonthlyFlow(transactions, monthKeys);
    const june = flow.find((bucket) => bucket.month === "2026-06");

    expect(june).toEqual({ month: "2026-06", income: 150_000, expenses: 30_000 });
  });

  it("buckets a transaction by its Jakarta calendar month even at a UTC month boundary", () => {
    // 2026-04-30T17:30:00Z is 2026-05-01 in Asia/Jakarta.
    const transactions = [tx("boundary", "EXPENSE", 5_000, "2026-04-30T17:30:00.000Z")];

    const flow = buildMonthlyFlow(transactions, ["2026-04", "2026-05"]);

    expect(flow).toEqual([
      { month: "2026-04", income: 0, expenses: 0 },
      { month: "2026-05", income: 0, expenses: 5_000 },
    ]);
  });
});
