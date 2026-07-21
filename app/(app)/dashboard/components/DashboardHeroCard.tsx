import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";

export interface DashboardHeroCardProps {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  netSavings: number;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Hero Card — Net Worth, Total Assets, Total Outstanding Debt come from
 * GET /dashboard/summary (PD-001: netWorth = assets − debt). Never falls back
 * to 0 on error — that would render a fake financial value.
 */
export function DashboardHeroCard({
  netWorth,
  totalAssets,
  totalDebts,
  netSavings,
  isLoading,
  isError,
}: DashboardHeroCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];

  return (
    <section className="rounded-xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-sm md:p-8">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/60">
            {t("financialPosition")}
          </p>
          {isError ? (
            <p className="mt-3 text-sm font-semibold text-coral">
              {t("failedToLoadSummary")}
            </p>
          ) : isLoading ? (
            <div
              className="mt-3 h-10 w-56 animate-pulse rounded bg-white/10"
              aria-hidden="true"
            />
          ) : (
            <h2 className="mt-3 text-[32px] font-semibold leading-tight tabular-nums md:text-[40px]">
              {formatCurrency(netWorth, intlLocale)}
            </h2>
          )}
        </div>
        <div className="text-sm text-white/45 md:text-right">
          <p>{t("lastUpdated")}</p>
        </div>
      </div>
      <div className="grid gap-8 border-t border-white/10 pt-8 md:grid-cols-3">
        <div>
          <p className="text-[12px] font-semibold text-mint">{t("totalAssets")}</p>
          {isError ? (
            <p className="mt-1 text-sm text-coral">{t("failedToLoad")}</p>
          ) : isLoading ? (
            <div
              className="mt-1 h-6 w-28 animate-pulse rounded bg-white/10"
              aria-hidden="true"
            />
          ) : (
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(totalAssets, intlLocale)}
            </p>
          )}
        </div>
        <div>
          <p className="text-[12px] font-semibold text-coral">{t("totalDebts")}</p>
          {isError ? (
            <p className="mt-1 text-sm text-coral">{t("failedToLoad")}</p>
          ) : isLoading ? (
            <div
              className="mt-1 h-6 w-28 animate-pulse rounded bg-white/10"
              aria-hidden="true"
            />
          ) : (
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(totalDebts, intlLocale)}
            </p>
          )}
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white/60">
            {t("monthDelta")}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatCurrency(netSavings, intlLocale)}
          </p>
        </div>
      </div>
    </section>
  );
}
