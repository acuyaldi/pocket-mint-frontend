"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import type { PercentageChange } from "@/src/types/analytics";

export interface AnalyticsSummaryCardProps {
  label: string;
  /** Already-formatted headline value (money string or plain count) — caller controls formatting. */
  value: string;
  change: number;
  percentageChange: PercentageChange;
  intlLocale: string;
  /** Money vs plain-count change formatting. Defaults to money. */
  changeIsCurrency?: boolean;
  /** When false (e.g. Expense), an increase is unfavorable — flips the color, not the arrow direction. */
  increaseIsGood?: boolean;
}

export function AnalyticsSummaryCard({
  label,
  value,
  change,
  percentageChange,
  intlLocale,
  changeIsCurrency = true,
  increaseIsGood = true,
}: AnalyticsSummaryCardProps) {
  const t = useTranslations("analytics.overview");
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const isFavorable = direction === "flat" ? null : direction === "up" ? increaseIsGood : !increaseIsGood;
  const toneClass =
    isFavorable === null ? "text-muted-foreground" : isFavorable ? "text-mint" : "text-coral";

  const changeText = changeIsCurrency
    ? formatCurrency(Math.abs(change), intlLocale)
    : Math.abs(change).toLocaleString(intlLocale);

  return (
    <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-4 text-[28px] font-semibold leading-tight tabular-nums text-primary">{value}</p>

      <div className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${toneClass}`}>
        {direction === "up" ? (
          <ArrowUp className="size-4" aria-hidden="true" />
        ) : direction === "down" ? (
          <ArrowDown className="size-4" aria-hidden="true" />
        ) : (
          <Minus className="size-4" aria-hidden="true" />
        )}
        {percentageChange.reason === "ZERO_BASELINE" || percentageChange.value === null ? (
          <span>{t("noComparison")}</span>
        ) : (
          <span>
            {t("changeVsPrevious", {
              percent: `${percentageChange.value >= 0 ? "+" : ""}${Math.round(percentageChange.value * 10) / 10}%`,
              amount: changeText,
            })}
          </span>
        )}
      </div>
    </article>
  );
}
