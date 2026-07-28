import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/id.json";
import { AnalyticsSummaryCard } from "./AnalyticsSummaryCard";

/**
 * Overview summary card for the Analytics page. The `loading` variant renders
 * the exact same card frame and text line-boxes as the loaded card, replaced
 * by neutral skeleton bars — this lets the overview section stay mounted while
 * data loads so it reserves its final height instead of being inserted above
 * the charts (the /analytics layout-shift root cause).
 */
const meta = {
  title: "Analytics/AnalyticsSummaryCard",
  component: AnalyticsSummaryCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Information-first summary metric. Loaded state shows a headline value plus a period-over-period change; loading state reserves identical geometry with skeleton bars.",
      },
    },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="id" messages={messages}>
        <div className="max-w-[320px]">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
} satisfies Meta<typeof AnalyticsSummaryCard>;

export default meta;
// Loose args type: the component's props are a discriminated union
// (data card | loading), which Storybook's arg inference collapses to `never`.
// Stories set args/render explicitly, so a loose StoryObj keeps them type-safe
// to author without fighting the union.
type Story = StoryObj;

/** Positive change (income up) — favorable tone. */
export const IncomeUp: Story = {
  args: {
    label: "Pemasukan",
    value: "Rp 8.200.000",
    change: 1_200_000,
    percentageChange: { value: 17.1, reason: null },
    intlLocale: "id-ID",
    increaseIsGood: true,
  },
};

/** Expense up — unfavorable tone (increase is bad). */
export const ExpenseUp: Story = {
  args: {
    label: "Pengeluaran",
    value: "Rp 5.750.000",
    change: 640_000,
    percentageChange: { value: 12.5, reason: null },
    intlLocale: "id-ID",
    increaseIsGood: false,
  },
};

/** No previous period to compare against (zero baseline) — neutral tone. */
export const NoComparison: Story = {
  args: {
    label: "Transaksi",
    value: "128",
    change: 0,
    percentageChange: { value: null, reason: "ZERO_BASELINE" },
    intlLocale: "id-ID",
    changeIsCurrency: false,
  },
};

/** Loading skeleton — same geometry as a loaded card, hidden from assistive tech. */
export const Loading: Story = {
  args: { loading: true },
};

/** Loaded row and loading row side by side — bounding boxes must match. */
export const LoadedVsLoading: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <NextIntlClientProvider locale="id" messages={messages}>
      <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsSummaryCard
          label="Pemasukan"
          value="Rp 8.200.000"
          change={1_200_000}
          percentageChange={{ value: 17.1, reason: null }}
          intlLocale="id-ID"
          increaseIsGood
        />
        <AnalyticsSummaryCard loading />
        <AnalyticsSummaryCard loading />
        <AnalyticsSummaryCard loading />
      </div>
    </NextIntlClientProvider>
  ),
};

/** Very large IDR value — tabular figures, must not overflow the card. */
export const LargeValue: Story = {
  args: {
    label: "Arus kas bersih",
    value: "Rp 1.284.560.000.000",
    change: 250_000_000,
    percentageChange: { value: 8.3, reason: null },
    intlLocale: "id-ID",
    increaseIsGood: true,
  },
};

/** Long label (verbose translation) — wraps without changing the card frame. */
export const LongLabel: Story = {
  args: {
    label: "Perubahan arus kas bersih dibanding periode sebelumnya",
    value: "Rp 2.450.000",
    change: -180_000,
    percentageChange: { value: -6.8, reason: null },
    intlLocale: "id-ID",
    increaseIsGood: true,
  },
};
