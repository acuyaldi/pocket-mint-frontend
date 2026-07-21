"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsCategories } from "@/src/types/analytics";

const BAR_COLORS = [
  "var(--color-mint, #2DD4BF)",
  "var(--color-primary, #1a1c1c)",
  "var(--color-coral, #F87171)",
  "var(--color-amber, #F59E0B)",
  "var(--color-muted-foreground, #414848)",
];

interface Props {
  data: AnalyticsCategories;
  intlLocale: string;
}

export function CategoryBreakdown({ data, intlLocale }: Props) {
  const t = useTranslations("analytics.categories");

  const sorted = useMemo(
    () => [...data.categories].sort((a, b) => b.amount - a.amount),
    [data.categories],
  );

  const chartData = useMemo(
    () =>
      sorted.map((c) => ({
        name: c.name,
        amount: c.amount,
        percentage: c.percentage ? `${Math.round(c.percentage * 10) / 10}%` : "—",
        transactionCount: c.transactionCount,
      })),
    [sorted],
  );

  if (data.categories.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-low text-sm text-muted-foreground">
        {t("empty", {
          type:
            data.type === "INCOME" ? t("options.INCOME") : t("options.EXPENSE"),
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Accessible data table as text fallback */}
      <table className="sr-only" role="table">
        <caption>
          {t("title")}: {t("subtitle")}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("options.EXPENSE")}</th>
            <th scope="col">{t("percentageOfTotal", { percent: "" })}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.categoryId ?? "__uncategorized__"}>
              <td>{c.name}</td>
              <td>
                {c.percentage !== null ? `${Math.round(c.percentage)}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 44)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground, #414848)" }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value ?? 0), intlLocale), ""]}
            labelFormatter={(label: unknown) => String(label ?? "")}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--color-border, #c0c8c7)",
              background: "var(--color-card, #ffffff)",
              fontSize: 13,
            }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <ul className="mt-4 space-y-2.5">
        {sorted.map((c, i) => (
          <li
            key={c.categoryId ?? "__uncategorized__"}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                }}
              />
              <span className="font-medium text-foreground">{c.name}</span>
              {c.percentage !== null && (
                <span className="text-muted-foreground">
                  {t("percentageOfTotal", {
                    percent: `${Math.round(c.percentage)}%`,
                  })}
                </span>
              )}
            </span>
            <span className="tabular-nums font-semibold text-primary">
              {formatCurrency(c.amount, intlLocale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
