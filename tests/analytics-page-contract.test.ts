import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const analyticsSource = readFileSync(root + "app/(app)/analytics/page.tsx", "utf8");
const dashboardSource = readFileSync(root + "app/(app)/dashboard/page.tsx", "utf8");
const transactionsPageSource = readFileSync(
  root + "app/(app)/transactions/page.tsx",
  "utf8",
);
const hooksSource = readFileSync(
  root + "src/features/transactions/hooks/useTransactions.ts",
  "utf8",
);

describe("Transaction data sourcing (PM-STAB-002)", () => {
  it("useAllTransactions hits GET /transactions/all, unscoped by month", () => {
    expect(hooksSource).toContain("useAllTransactions");
    expect(hooksSource).toContain("'/transactions/all'");
  });

  it("useTransactions (current-month) is still backed by GET /transactions", () => {
    expect(hooksSource).toContain("useTransactions = ()");
    expect(hooksSource).toContain("'/transactions'");
  });

  it("Analytics reads the full transaction history for its period filters and charts", () => {
    expect(analyticsSource).toContain("useAllTransactions()");
    expect(analyticsSource).not.toContain("useTransactions()");
  });

  it("Dashboard keeps the current-month endpoint for Current Period Summary and Recent Activity", () => {
    expect(dashboardSource).toContain("useTransactions()");
    expect(dashboardSource).not.toContain("useAllTransactions()");
  });

  it("the Transactions journal keeps the current-month endpoint (unchanged by this fix)", () => {
    expect(transactionsPageSource).toContain("useTransactions()");
    expect(transactionsPageSource).not.toContain("useAllTransactions()");
  });
});
