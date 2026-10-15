"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsWallets } from "@/src/types/analytics";

interface Props {
  data: AnalyticsWallets;
  intlLocale: string;
}

export function WalletBreakdown({ data, intlLocale }: Props) {
  const t = useTranslations("analytics.wallets");

  const wallets = useMemo(
    () =>
      [...data.wallets].sort(
        (a, b) => Math.abs(b.netCashFlow) - Math.abs(a.netCashFlow),
      ),
    [data.wallets],
  );

  if (wallets.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-low text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <caption className="sr-only">{t("title")}</caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <th scope="col" className="pb-3 pr-4 font-semibold">
              {t("columns.wallet")}
            </th>
            <th scope="col" className="pb-3 pr-4 text-right font-semibold">
              {t("columns.income")}
            </th>
            <th scope="col" className="pb-3 pr-4 text-right font-semibold">
              {t("columns.expense")}
            </th>
            <th scope="col" className="pb-3 text-right font-semibold">
              {t("columns.net")}
            </th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((w) => {
            const isPositive = w.netCashFlow >= 0;
            return (
              <tr
                key={w.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="py-3 pr-4 text-sm font-medium text-foreground">
                  {w.name}
                </td>
                <td className="py-3 pr-4 text-right text-sm tabular-nums text-mint">
                  {formatCurrency(w.income, intlLocale)}
                </td>
                <td className="py-3 pr-4 text-right text-sm tabular-nums text-foreground">
                  {formatCurrency(w.expense, intlLocale)}
                </td>
                <td
                  className={`py-3 text-right text-sm font-semibold tabular-nums ${
                    isPositive ? "text-mint" : "text-coral"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {formatCurrency(w.netCashFlow, intlLocale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
