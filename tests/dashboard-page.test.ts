import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const pageSource = readFileSync(root + "app/(app)/dashboard/page.tsx", "utf8");
const hookSource = readFileSync(
  root + "src/features/dashboard/hooks/useDashboardSummary.ts",
  "utf8",
);

describe("Dashboard page source contract (PM-STAB-001)", () => {
  it("uses the backend dashboard summary as the source of truth for Net Worth", () => {
    expect(pageSource).toContain("useDashboardSummary()");
    expect(pageSource).toContain("dashboardSummary?.netWorth");
    expect(pageSource).toContain("dashboardSummary?.totalAssets");
    expect(pageSource).toContain("dashboardSummary?.totalDebts");
  });

  it("no longer computes Net Worth locally from wallet balances", () => {
    // The fixed bug: `return { totalAssets: assets, totalDebts: debts, netWorth: assets }`
    expect(pageSource).not.toContain("netWorth: assets");
    expect(pageSource).not.toContain("netWorth:netWorth");
  });

  it("passes the summary's loading/error state through instead of masking failures as zero", () => {
    expect(pageSource).toContain("isSummaryError");
    expect(pageSource).toContain("isSummaryLoading");
  });

  it("hook calls GET /dashboard/summary and maps the bare snake_case response", () => {
    expect(hookSource).toContain('"/dashboard/summary"');
    expect(hookSource).toContain("total_aset");
    expect(hookSource).toContain("total_utang");
    expect(hookSource).toContain("net_worth");
    expect(hookSource).toContain("totalAssets: response.data.total_aset");
    expect(hookSource).toContain("totalDebts: response.data.total_utang");
    expect(hookSource).toContain("netWorth: response.data.net_worth");
  });

  it("does not duplicate the dashboard summary query hook", () => {
    const matches = pageSource.match(/useDashboardSummary\(\)/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
