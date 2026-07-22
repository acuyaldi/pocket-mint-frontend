import type { AnalyticsPeriod } from "@/src/types/analytics";

export const ANALYTICS_PERIODS: AnalyticsPeriod[] = [
  "current-month",
  "previous-month",
  "last-3-months",
  "last-6-months",
  "current-year",
  "custom",
];

export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriod = "current-month";

function isAnalyticsPeriod(value: string | null): value is AnalyticsPeriod {
  return !!value && (ANALYTICS_PERIODS as string[]).includes(value);
}

/** ISO "YYYY-MM-DD" shape check — good enough client-side, the backend is the source of truth. */
function isIsoDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export interface AnalyticsUrlState {
  period: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}

/**
 * Reads the Analytics period selection from URL search params, falling back
 * to the default on anything malformed (unknown period, custom period
 * missing/invalid dates) rather than throwing — the URL is user-editable.
 */
export function parseAnalyticsSearchParams(searchParams: URLSearchParams): AnalyticsUrlState {
  const periodParam = searchParams.get("period");
  const period = isAnalyticsPeriod(periodParam) ? periodParam : DEFAULT_ANALYTICS_PERIOD;

  if (period !== "custom") {
    return { period };
  }

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || startDate > endDate) {
    return { period: DEFAULT_ANALYTICS_PERIOD };
  }
  return { period, startDate, endDate };
}

/** Serializes the Analytics selection back into a URL query string (no leading "?"). */
export function serializeAnalyticsSearchParams(state: AnalyticsUrlState): string {
  const params = new URLSearchParams({ period: state.period });
  if (state.period === "custom" && state.startDate && state.endDate) {
    params.set("startDate", state.startDate);
    params.set("endDate", state.endDate);
  }
  return params.toString();
}

/** Client-side guard before firing a custom-range query: both dates set, start <= end. */
export function validateCustomRange(startDate: string, endDate: string): string | null {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return "invalidRange";
  }
  if (startDate > endDate) {
    return "startAfterEnd";
  }
  return null;
}

/** Human date-range label, e.g. "1 – 31 Jul 2026", from ISO period boundaries. */
export function formatPeriodRangeLabel(
  periodStart: string,
  periodEnd: string,
  intlLocale: string,
): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const formatter = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}
