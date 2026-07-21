"use client";

import { useTranslations } from "next-intl";
import type { BudgetStatus } from "@/src/types/budget";

const TONE_CLASS: Record<BudgetStatus, string> = {
  HEALTHY: "bg-mint/10 text-mint",
  APPROACHING: "bg-amber/10 text-amber",
  REACHED: "bg-amber/10 text-amber",
  EXCEEDED: "bg-coral/10 text-coral",
  ARCHIVED: "bg-surface-high text-muted-foreground",
};

/** Centralized Budget status presentation — label is always backend-driven text, never color-only. */
export function BudgetStatusPill({ status }: { status: BudgetStatus }) {
  const t = useTranslations("budgets.status");

  return (
    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${TONE_CLASS[status]}`}>
      {t(status)}
    </span>
  );
}
