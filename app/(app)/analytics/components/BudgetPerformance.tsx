"use client";

import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { BudgetStatusPill } from "@/app/(app)/anggaran/components/BudgetStatusPill";
import { BudgetProgressBar } from "@/app/(app)/anggaran/components/BudgetProgressBar";
import type { AnalyticsBudgetPerformance } from "@/src/types/analytics";

interface Props {
  data: AnalyticsBudgetPerformance[];
  intlLocale: string;
}

export function BudgetPerformance({ data, intlLocale }: Props) {
  const t = useTranslations("analytics.budgetPerformance");

  if (data.length === 0) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-low text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <ul className="space-y-5">
      {data.map((b) => (
        <li key={b.id} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {b.category.name}
              </p>
              <BudgetStatusPill status={b.status} />
            </div>
            <p className="shrink-0 text-sm tabular-nums font-semibold text-primary">
              {formatCurrency(b.spent, intlLocale)}
              <span className="ml-1 font-normal text-muted-foreground">
                / {formatCurrency(b.limit, intlLocale)}
              </span>
            </p>
          </div>
          <BudgetProgressBar
            percentUsed={b.percentUsed}
            status={b.status}
          />
          <p className="text-xs text-muted-foreground">
            {b.remaining >= 0
              ? t("remainingLabel", {
                  remaining: formatCurrency(b.remaining, intlLocale),
                })
              : t("limitLabel", {
                  limit: formatCurrency(b.limit, intlLocale),
                })}
          </p>
        </li>
      ))}
    </ul>
  );
}
