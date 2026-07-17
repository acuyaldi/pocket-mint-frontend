import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardHeroCard } from "@/app/(app)/dashboard/components/DashboardHeroCard";
import { formatCurrency } from "@/lib/utils";

function render(overrides: Partial<React.ComponentProps<typeof DashboardHeroCard>> = {}) {
  return renderToStaticMarkup(
    React.createElement(DashboardHeroCard, {
      netWorth: 0,
      totalAssets: 0,
      totalDebts: 0,
      netSavings: 0,
      isLoading: false,
      isError: false,
      ...overrides,
    }),
  );
}

describe("DashboardHeroCard — Net Worth (PM-STAB-001)", () => {
  it("renders assets minus debt, not assets alone", () => {
    const markup = render({
      totalAssets: 10_300_000,
      totalDebts: 500_000,
      netWorth: 9_800_000,
    });

    // Net worth (9.8M) must render distinctly from total assets (10.3M) — the old
    // bug rendered Net Worth === Total Assets, silently ignoring debt.
    expect(markup).toContain(formatCurrency(9_800_000));
    expect(markup).toContain(formatCurrency(10_300_000));
    expect(markup).toContain(formatCurrency(500_000));
    expect(formatCurrency(9_800_000)).not.toBe(formatCurrency(10_300_000));
  });

  it("equals total assets when the user has no debt", () => {
    const markup = render({
      totalAssets: 5_000_000,
      totalDebts: 0,
      netWorth: 5_000_000,
    });

    const netWorthText = formatCurrency(5_000_000);
    // Net worth and total assets both render the same formatted amount.
    expect(markup.split(netWorthText).length - 1).toBeGreaterThanOrEqual(2);
  });

  it("renders a negative net worth (debt exceeds assets) without clamping to zero", () => {
    const markup = render({
      totalAssets: 5_000_000,
      totalDebts: 8_000_000,
      netWorth: -3_000_000,
      netSavings: 250_000,
    });

    expect(markup).toContain(formatCurrency(-3_000_000));
    expect(markup).not.toContain(formatCurrency(0));
  });

  it("displays outstanding debt as a positive figure, not negated again", () => {
    const markup = render({ totalAssets: 1_000_000, totalDebts: 500_000, netWorth: 500_000 });

    expect(markup).toContain(formatCurrency(500_000));
    expect(markup).not.toContain(formatCurrency(-500_000));
  });

  it("never fabricates a zero net worth on error — shows an explicit error state instead", () => {
    // netSavings is unrelated to the summary endpoint (comes from useMonthlySummary)
    // and renders unconditionally; give it a distinct non-zero value so it can't be
    // mistaken for a fabricated net worth of zero in the assertion below.
    const markup = render({
      isError: true,
      netWorth: 0,
      totalAssets: 0,
      totalDebts: 0,
      netSavings: 250_000,
    });

    expect(markup).toContain("Gagal memuat");
    expect(markup).not.toContain(formatCurrency(0));
  });

  it("shows a loading placeholder instead of a fabricated number while pending", () => {
    const markup = render({ isLoading: true, netSavings: 250_000 });

    expect(markup).toContain("animate-pulse");
    expect(markup).not.toContain(formatCurrency(0));
  });
});
