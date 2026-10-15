"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsTrends } from "@/src/types/analytics";

/** Accessible, non-color-only label for a trend bucket. */
function bucketLabel(start: string, end: string, intlLocale: string) {
  const fmt = new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
  });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

interface Props {
  data: AnalyticsTrends;
  intlLocale: string;
  /** Optional drill-down: click a bucket to see its transactions. */
  onBucketClick?: (start: string, end: string) => void;
}

export function CashFlowTrend({ data, intlLocale }: Props) {
  const t = useTranslations("analytics.trends");

  const chartData = useMemo(
    () =>
      data.buckets.map((b) => ({
        ...b,
        label: bucketLabel(b.start, b.end, intlLocale),
      })),
    [data.buckets, intlLocale],
  );

  const maxY = useMemo(() => {
    const peak = Math.max(
      1,
      ...data.buckets.flatMap((b) => [b.income, b.expense]),
    );
    return Math.ceil(peak / 100_000) * 100_000 + 100_000; // round up to nearest 100k + headroom
  }, [data.buckets]);

  const firstNet = data.buckets[0]?.netCashFlow ?? 0;
  const lastNet = data.buckets[data.buckets.length - 1]?.netCashFlow ?? 0;
  const diff = lastNet - firstNet;
  const pct =
    firstNet !== 0 ? `${Math.round((Math.abs(diff) / Math.abs(firstNet)) * 100)}%` : "—";
  const summaryKey =
    diff > 0 ? "summaryUp" : diff < 0 ? "summaryDown" : "summaryFlat";

  if (data.buckets.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-low text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div>
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {data.buckets.length >= 2
          ? t(summaryKey, { percent: pct })
          : ""}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #414848)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border, #c0c8c7)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #414848)" }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxY]}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : `${v}`
            }
            width={48}
          />
          <Tooltip
            formatter={(value) => [
              formatCurrency(Number(value ?? 0), intlLocale),
              "",
            ]}
            labelFormatter={(label: unknown) => String(label ?? "")}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--color-border, #c0c8c7)",
              background: "var(--color-card, #ffffff)",
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="income"
            name="income"
            fill="var(--color-mint, #2DD4BF)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Bar
            dataKey="expense"
            name="expense"
            fill="var(--color-coral, #F87171)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Line
            dataKey="netCashFlow"
            name="netCashFlow"
            stroke="var(--color-primary, #1a1c1c)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: "var(--color-mint, #2DD4BF)" }} />
          {t("income")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: "var(--color-coral, #F87171)" }} />
          {t("expense")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ backgroundColor: "var(--color-primary, #1a1c1c)" }} />
          {t("net")}
        </span>
      </div>
    </div>
  );
}
