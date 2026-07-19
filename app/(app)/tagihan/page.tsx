"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CalendarClock, CircleDollarSign, LoaderCircle } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import { PageHeader } from "@/components/layout/page-header";
import {
  countDueSoon,
  getJakartaDateKey,
  useBills,
  type BillDto,
} from "@/src/features/bills/hooks/useBills";
import { useWallets } from "@/src/features/wallets/hooks/useWallets";
import { BillCard } from "./components/BillCard";
import { PayBillModal } from "./components/PayBillModal";

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </article>
  );
}

export default function TagihanPage() {
  const t = useTranslations("tagihan");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const { data: bills = [], isLoading } = useBills();
  const { data: wallets = [] } = useWallets();
  const [selectedBill, setSelectedBill] = useState<BillDto | null>(null);

  const activeBills = useMemo(
    () =>
      bills
        .filter((bill) => bill.status === "ACTIVE" || bill.status === "OVERDUE")
        .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)),
    [bills],
  );
  const dueSoonCount = countDueSoon(bills, getJakartaDateKey(), 3);
  const amountDue = activeBills.reduce((sum, bill) => sum + bill.amountPerTerm, 0);
  const outstanding = activeBills.reduce(
    (sum, bill) => sum + Math.max(0, bill.grandTotal - bill.paidTerms * bill.amountPerTerm),
    0,
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="size-10 animate-spin text-primary" aria-label={t("loadingAria")} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
      />

      {dueSoonCount > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber/30 bg-amber/10 p-4" role="status">
          <AlertTriangle className="size-5 shrink-0 text-amber" />
          <p className="text-sm font-medium text-foreground">
            {t("dueSoonWarning", { count: dueSoonCount })}
          </p>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("activeInstallments")} value={String(activeBills.length)} helper={t("activeInstallmentsHelper")} />
        <StatCard label={t("nextPayment")} value={formatCurrency(amountDue, intlLocale)} helper={t("nextPaymentHelper", { count: dueSoonCount })} />
        <StatCard label={t("totalOutstanding")} value={formatCurrency(outstanding, intlLocale)} helper={t("totalOutstandingHelper")} />
      </section>

      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <CalendarClock className="size-5 text-primary" /> {t("listTitle")}
      </div>

      {activeBills.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeBills.map((bill) => (
            <BillCard key={bill.id} bill={bill} onPay={setSelectedBill} />
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <CircleDollarSign className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">{t("emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("emptyBody")}</p>
        </div>
      )}

      {selectedBill ? (
        <PayBillModal
          key={selectedBill.id}
          bill={selectedBill}
          wallets={wallets}
          onClose={() => setSelectedBill(null)}
        />
      ) : null}
    </div>
  );
}
