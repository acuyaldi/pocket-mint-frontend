import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import enMessages from "@/messages/en.json";
import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/(app)/analytics/page.tsx", "utf8");

/**
 * CLS remediation contract for /analytics (perf/frontend-cls-remediation).
 *
 * Root cause of the dominant layout-shift cluster: the overview summary-cards
 * <section> was conditionally mounted only after `overview.data` resolved, so
 * it was inserted ABOVE the already-painted charts grid on data arrival,
 * shoving every chart down by the section's full height (~203px desktop,
 * ~708px mobile). Each chart <article> body was likewise `null` until its
 * query resolved, then grew. These tests lock in the structural fix.
 */
describe("Analytics page — CLS structural contract", () => {
  it("does not conditionally mount the overview section behind overview.data (the insertion shift)", () => {
    expect(page).not.toContain("{overview.data && (");
  });

  it("renders the overview cards row during loading via the AnalyticsSummaryCard loading variant", () => {
    // The section stays mounted; cards switch between a loading skeleton and
    // the real value, reserving the same geometry from first paint.
    expect(page).toMatch(/AnalyticsSummaryCard[\s\S]{0,40}loading/);
    expect(page).toContain("overview.data ?");
  });

  it("reserves body height for every chart while its query is loading (no grow-on-load)", () => {
    // Each chart's body renders a height-reserving <ChartSkeleton> while its
    // query is loading instead of `null`, so the <article> doesn't grow when
    // the chart mounts. Definition (1) + one usage per chart (4) = 5.
    const skeletonUses = (page.match(/ChartSkeleton/g) ?? []).length;
    expect(skeletonUses).toBeGreaterThanOrEqual(5);

    for (const chart of [
      "CashFlowTrend",
      "CategoryBreakdown",
      "WalletBreakdown",
      "BudgetPerformance",
    ]) {
      expect(page.indexOf(`<${chart}`), `${chart} should be rendered`).toBeGreaterThan(-1);
    }
    // Each chart body must gate the skeleton on its own loading flag.
    for (const q of ["trends", "categories", "wallets", "budgetPerf"]) {
      expect(page, `${q} loading fallback`).toContain(`${q}.isLoading ? (`);
    }
  });

  it("keeps the page heading mounted ahead of any data-dependent section", () => {
    const headerIdx = page.indexOf("<PageHeader");
    const overviewIdx = page.indexOf("lg:grid-cols-4");
    const chartsIdx = page.indexOf("lg:grid-cols-2");
    expect(headerIdx).toBeGreaterThan(-1);
    expect(headerIdx).toBeLessThan(overviewIdx);
    expect(overviewIdx).toBeLessThan(chartsIdx);
  });

  it("announces analytics loading to assistive tech (accessible loading state)", () => {
    expect(page).toContain('role="status"');
    expect(enMessages.analytics.loading).toBeTruthy();
    expect(idMessages.analytics.loading).toBeTruthy();
  });
});
