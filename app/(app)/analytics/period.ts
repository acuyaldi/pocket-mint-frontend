import type { Transaction } from "@/src/types/transaction";

export type PeriodFilter = "month" | "quarter" | "six-months";

const REPORTING_TIMEZONE = "Asia/Jakarta";

const PERIOD_MONTHS: Record<PeriodFilter, number> = {
  month: 1,
  quarter: 3,
  "six-months": 6,
};

/**
 * Calendar month key (YYYY-MM) for a date, resolved in the same reporting
 * timezone the backend uses for its month boundaries (`REPORTING_TIMEZONE`,
 * default Asia/Jakarta) — never the browser's local timezone.
 */
export function getJakartaMonthKey(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORTING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
}

function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Calendar month keys for the selected period, oldest first, ending at the
 * current reporting month. Built purely from the calendar — never from
 * transaction data — so a month with zero transactions still appears.
 */
export function getPeriodMonthKeys(period: PeriodFilter, now = new Date()): string[] {
  const currentKey = getJakartaMonthKey(now);
  const count = PERIOD_MONTHS[period];
  return Array.from({ length: count }, (_, index) => shiftMonthKey(currentKey, -(count - 1 - index)));
}

/** Transactions whose reporting-month falls within the selected period. */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: PeriodFilter,
  now = new Date(),
): Transaction[] {
  const monthKeys = new Set(getPeriodMonthKeys(period, now));
  return transactions.filter((transaction) => monthKeys.has(getJakartaMonthKey(transaction.date)));
}

export interface MonthlyFlowBucket {
  month: string;
  income: number;
  expenses: number;
}

/**
 * Income/expense totals per calendar month for the given month keys. Every
 * key gets a bucket (zero if there were no transactions that month); each
 * transaction is visited exactly once.
 */
export function buildMonthlyFlow(
  transactions: Transaction[],
  monthKeys: string[],
): MonthlyFlowBucket[] {
  const buckets = new Map<string, MonthlyFlowBucket>(
    monthKeys.map((key) => [key, { month: key, income: 0, expenses: 0 }]),
  );

  for (const transaction of transactions) {
    const bucket = buckets.get(getJakartaMonthKey(transaction.date));
    if (!bucket) continue;
    if (transaction.type === "INCOME") bucket.income += transaction.amount;
    if (transaction.type === "EXPENSE") bucket.expenses += transaction.amount;
  }

  return monthKeys.map((key) => buckets.get(key)!);
}
