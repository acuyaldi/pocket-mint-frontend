"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ANALYTICS_PERIODS, type AnalyticsUrlState, validateCustomRange } from "@/src/features/analytics/period";
import type { AnalyticsPeriod } from "@/src/types/analytics";

const PRESET_KEY: Record<Exclude<AnalyticsPeriod, "custom">, string> = {
  "current-month": "currentMonth",
  "previous-month": "previousMonth",
  "last-3-months": "last3Months",
  "last-6-months": "last6Months",
  "current-year": "currentYear",
};

export function AnalyticsPeriodSelector({
  state,
  onChange,
}: {
  state: AnalyticsUrlState;
  onChange: (next: AnalyticsUrlState) => void;
}) {
  const t = useTranslations("analytics.periodSelector");
  const [showCustom, setShowCustom] = useState(state.period === "custom");
  const [draftStart, setDraftStart] = useState(state.startDate ?? "");
  const [draftEnd, setDraftEnd] = useState(state.endDate ?? "");
  const [error, setError] = useState<string | null>(null);

  const handlePreset = (period: AnalyticsPeriod) => {
    if (period === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    setError(null);
    onChange({ period });
  };

  const handleApplyCustom = () => {
    const issue = validateCustomRange(draftStart, draftEnd);
    if (issue) {
      setError(t(issue === "startAfterEnd" ? "errorStartAfterEnd" : "errorInvalidRange"));
      return;
    }
    setError(null);
    onChange({ period: "custom", startDate: draftStart, endDate: draftEnd });
  };

  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("label")}>
        {ANALYTICS_PERIODS.map((period) => {
          const isActive = period === "custom" ? showCustom : !showCustom && state.period === period;
          const label = period === "custom" ? t("options.custom") : t(`options.${PRESET_KEY[period]}`);
          return (
            <button
              key={period}
              type="button"
              aria-pressed={isActive}
              onClick={() => handlePreset(period)}
              className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-surface-low"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {showCustom ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("startDate")}
            <input
              type="date"
              value={draftStart}
              max={draftEnd || undefined}
              onChange={(event) => setDraftStart(event.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("endDate")}
            <input
              type="date"
              value={draftEnd}
              min={draftStart || undefined}
              onChange={(event) => setDraftEnd(event.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <button
            type="button"
            onClick={handleApplyCustom}
            className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("apply")}
          </button>
          {error ? (
            <p role="alert" className="w-full text-xs font-medium text-coral">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
