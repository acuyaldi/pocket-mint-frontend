"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import type { PercentageChange } from "@/src/types/analytics";

interface AnalyticsSummaryCardDataProps {
  loading?: false;
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

/**
 * Loading variant. Renders the SAME card frame and the same three text
 * line-boxes (label / value / change) as the loaded card, with the text
 * replaced by neutral skeleton bars. Keeping identical geometry lets the
 * overview section stay mounted during loading so it reserves its final
 * height instead of being inserted above the charts on data arrival — the
 * root cause of the /analytics layout-shift cluster.
 */
interface AnalyticsSummaryCardLoadingProps {
  loading: true;
}

export type AnalyticsSummaryCardProps =
  | AnalyticsSummaryCardDataProps
  | AnalyticsSummaryCardLoadingProps;

const CARD_CLASS = "min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5 xl:p-6";

function AnalyticsSummaryCardSkeleton() {
  return (
    <article className={CARD_CLASS} aria-hidden="true">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em]">
        <span className="inline-block h-3 w-20 rounded bg-surface-high align-middle motion-safe:animate-pulse" />
      </p>
      <p className="mt-4 text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-semibold leading-tight">
        <span className="inline-block h-7 w-32 rounded bg-surface-high align-middle motion-safe:animate-pulse" />
      </p>
      <div className="mt-3 flex h-5 items-center">
        <span className="inline-block h-3.5 w-28 rounded bg-surface-high motion-safe:animate-pulse" />
      </div>
    </article>
  );
}

export function AnalyticsSummaryCard(props: AnalyticsSummaryCardProps) {
  if (props.loading) {
    return <AnalyticsSummaryCardSkeleton />;
  }

  const {
    label,
    value,
    change,
    percentageChange,
    intlLocale,
    changeIsCurrency = true,
    increaseIsGood = true,
  } = props;
  return <AnalyticsSummaryCardContent {...{ label, value, change, percentageChange, intlLocale, changeIsCurrency, increaseIsGood }} />;
}

function AnalyticsSummaryCardContent({
  label,
  value,
  change,
  percentageChange,
  intlLocale,
  changeIsCurrency,
  increaseIsGood,
}: Required<Omit<AnalyticsSummaryCardDataProps, "loading">>) {
  const t = useTranslations("analytics.overview");
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const isFavorable = direction === "flat" ? null : direction === "up" ? increaseIsGood : !increaseIsGood;
  // AA-safe text tones for change text on the white card. The bright
  // --color-mint / --color-coral are decorative-only; the design system
  // provides -strong variants for colored text on light surfaces (see
  // app/globals.css). The direction arrow is the non-color status cue.
  const toneClass =
    isFavorable === null
      ? "text-muted-foreground"
      : isFavorable
        ? "text-mint-strong"
        : "text-coral-strong";

  const changeText = changeIsCurrency
    ? formatCurrency(Math.abs(change), intlLocale)
    : Math.abs(change).toLocaleString(intlLocale);

  return (
    <article className={CARD_CLASS}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-4 max-w-full text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-semibold leading-tight tabular-nums text-primary [overflow-wrap:anywhere]">
        {value}
      </p>

      <div className={`mt-3 flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-medium [overflow-wrap:anywhere] ${toneClass}`}>
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
          <span className="min-w-0">
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
