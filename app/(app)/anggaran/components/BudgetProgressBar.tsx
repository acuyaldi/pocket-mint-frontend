"use client";

import { useTranslations } from "next-intl";
import type { BudgetStatus } from "@/src/types/budget";

const BAR_TONE: Record<BudgetStatus, string> = {
  HEALTHY: "bg-mint",
  APPROACHING: "bg-amber",
  REACHED: "bg-amber",
  EXCEEDED: "bg-coral",
  ARCHIVED: "bg-muted-foreground",
};

/**
 * Visual width is capped at 100%; the accessible name/value always exposes the
 * true (possibly >100) percentUsed the backend returned — never recomputed here.
 */
export function BudgetProgressBar({ percentUsed, status }: { percentUsed: number | null; status: BudgetStatus }) {
  const t = useTranslations("budgets");
  const value = percentUsed ?? 0;
  const width = Math.min(Math.max(value, 0), 100);
  const trueValue = Math.round(value * 100) / 100;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      // aria-valuenow must never exceed aria-valuemax (invalid ARIA range
      // otherwise) — cap it, and expose the true (possibly >100%) value via
      // aria-valuetext so assistive tech still announces the real number.
      aria-valuenow={Math.min(trueValue, 100)}
      aria-valuetext={t("progressAria", { percent: trueValue })}
      className="h-2 overflow-hidden rounded-full bg-surface-high"
    >
      <div className={`h-full rounded-full transition-all ${BAR_TONE[status]}`} style={{ width: `${width}%` }} />
    </div>
  );
}
