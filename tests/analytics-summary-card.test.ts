import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnalyticsSummaryCard } from "@/app/(app)/analytics/components/AnalyticsSummaryCard";
import messages from "@/messages/id.json";

type CardProps = React.ComponentProps<typeof AnalyticsSummaryCard>;

function render(props: CardProps) {
  return renderToStaticMarkup(
    // eslint-disable-next-line react/no-children-prop -- required prop on NextIntlClientProvider's type; createElement can't pass it positionally
    React.createElement(NextIntlClientProvider, {
      locale: "id",
      messages,
      children: React.createElement(AnalyticsSummaryCard, props),
    }),
  );
}

const CARD_FRAME = /rounded-xl[^"]*border[^"]*bg-card/;

describe("AnalyticsSummaryCard", () => {
  it("loaded state renders the headline value inside the card frame", () => {
    const html = render({
      label: "Income",
      value: "Rp 1.000.000",
      change: 0,
      percentageChange: { value: null, reason: "ZERO_BASELINE" },
      intlLocale: "id-ID",
    });

    expect(html).toContain("Rp 1.000.000");
    expect(html).toMatch(CARD_FRAME);
  });

  it("lets long currency values wrap within the card instead of overflowing or overlapping", () => {
    const html = render({
      label: "Net Cash Flow",
      value: "Rp 1.284.560.000.000.000",
      change: 250_000_000_000,
      percentageChange: { value: 8.3, reason: null },
      intlLocale: "id-ID",
    });

    expect(html).toContain("min-w-0");
    expect(html).toContain("max-w-full");
    expect(html).toContain("[overflow-wrap:anywhere]");
    expect(html).toContain("text-[clamp(1.25rem,1rem+1vw,1.75rem)]");
  });

  it("keeps comparison text readable when the formatted amount is large", () => {
    const html = render({
      label: "Expense",
      value: "Rp 5.000.000",
      change: 999_999_999_999,
      percentageChange: { value: 144.4, reason: null },
      intlLocale: "id-ID",
      increaseIsGood: false,
    });

    expect(html).toContain("min-w-0");
    expect(html).toContain("flex-wrap");
    expect(html).toContain("[overflow-wrap:anywhere]");
  });

  it("loading state keeps the SAME card frame so the section reserves its final height (no insertion shift)", () => {
    const loaded = render({
      label: "Income",
      value: "Rp 1.000.000",
      change: 0,
      percentageChange: { value: null, reason: "ZERO_BASELINE" },
      intlLocale: "id-ID",
    });
    const loading = render({ loading: true });

    // Both states share the same structural container so mounting the section
    // during loading reserves the same geometry the loaded cards will occupy.
    expect(loaded).toMatch(CARD_FRAME);
    expect(loading).toMatch(CARD_FRAME);
  });

  it("loading state uses a reduced-motion-safe skeleton and is hidden from assistive tech", () => {
    const loading = render({ loading: true });
    expect(loading).toContain("animate-pulse");
    expect(loading).toContain('aria-hidden="true"');
  });

  it("loading state fabricates no financial data (no comparison copy, no headline value)", () => {
    const loading = render({ loading: true });
    // Skeleton must not render any of the data-dependent copy the loaded card shows.
    expect(loading).not.toContain(messages.analytics.overview.noComparison);
    expect(loading).not.toContain("Rp");
  });
});
