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

describe("Analytics v2 data sourcing", () => {
  it("Analytics page uses the new v2 aggregation hooks, not a full uncapped transaction fetch", () => {
    expect(analyticsSource).toContain("useAnalyticsOverview(");
    expect(analyticsSource).toContain("useAnalyticsTrends(");
    expect(analyticsSource).toContain("useAnalyticsCategories(");
    expect(analyticsSource).toContain("useAnalyticsWallets(");
    expect(analyticsSource).toContain("useAnalyticsBudgetPerformance()");
    // Must NOT compute analytics from a full transaction dump in the browser
    expect(analyticsSource).not.toContain("useAllTransactions()");
  });

  it("useAllTransactions hits GET /transactions/all, unscoped by month", () => {
    expect(hooksSource).toContain("useAllTransactions");
    expect(hooksSource).toContain("'/transactions/all'");
  });

  it("useTransactions (current-month) is still backed by GET /transactions", () => {
    expect(hooksSource).toContain("useTransactions = ()");
    expect(hooksSource).toContain("'/transactions'");
  });

  it("Dashboard keeps the current-month endpoint for Current Period Summary and Recent Activity", () => {
    expect(dashboardSource).toContain("useTransactions()");
    expect(dashboardSource).not.toContain("useAllTransactions()");
  });

  it("the Transactions journal keeps the current-month endpoint", () => {
    expect(transactionsPageSource).toContain("useTransactions()");
    expect(transactionsPageSource).not.toContain("useAllTransactions()");
  });
});
