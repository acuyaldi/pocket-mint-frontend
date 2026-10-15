"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/src/types/transaction";

interface Props {
  transactions: Transaction[];
  /** Total count (from pagination, may exceed items.length). */
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  intlLocale: string;
}

export function TransactionDrillDown({
  transactions,
  total,
  page,
  totalPages,
  onPageChange,
  onClose,
  intlLocale,
}: Props) {
  const t = useTranslations("analytics.drillDown");

  return (
    <div
      className="rounded-xl border border-border/70 bg-card p-6 shadow-sm"
      role="dialog"
      aria-label={t("title")}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">{t("title")}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("subtitle", { count: total })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-low transition-colors"
          aria-label={t("close")}
        >
          <X className="size-4" />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-low text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  <th scope="col" className="pb-2 pr-3 font-semibold">
                    Date
                  </th>
                  <th scope="col" className="pb-2 pr-3 font-semibold">
                    Description
                  </th>
                  <th scope="col" className="pb-2 pr-3 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="pb-2 pr-3 text-right font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isIncome = tx.type === "INCOME";
                  const isExpense = tx.type === "EXPENSE";
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-border/50 text-sm last:border-0"
                    >
                      <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                        {new Intl.DateTimeFormat(intlLocale, {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(tx.date))}
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-foreground max-w-[200px] truncate">
                        {tx.description || "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {tx.category?.name ?? t("noCategory")}
                      </td>
                      <td
                        className={`py-2.5 text-right tabular-nums font-semibold ${
                          isIncome
                            ? "text-mint"
                            : isExpense
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isIncome ? "+" : isExpense ? "" : ""}
                        {formatCurrency(tx.amount, intlLocale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-muted-foreground">
                {t("page", { page, total: totalPages })}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
