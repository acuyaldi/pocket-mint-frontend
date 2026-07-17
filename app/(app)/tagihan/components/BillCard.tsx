"use client";

import { Banknote, CalendarClock } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { getJakartaDateKey, type BillDto } from "@/src/features/bills/hooks/useBills";

function formatDueDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function BillCard({ bill, onPay }: { bill: BillDto; onPay: (bill: BillDto) => void }) {
  const isFull = bill.kind === "FULL";
  const isOverdue =
    bill.status === "OVERDUE" ||
    getJakartaDateKey(new Date(bill.nextDueDate)) < getJakartaDateKey();
  const isPayable = bill.status === "ACTIVE" || bill.status === "OVERDUE";
  const progress = bill.totalTerms > 0
    ? Math.min(100, Math.round((bill.paidTerms / bill.totalTerms) * 100))
    : 0;
  const remaining = Math.max(0, bill.grandTotal - bill.paidTerms * bill.amountPerTerm);

  return (
    <article className={`flex flex-col rounded-xl border border-border/70 border-t-4 bg-card p-5 shadow-sm ${isOverdue ? "border-t-coral" : "border-t-mint"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-primary">
            {bill.description || bill.walletName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {bill.walletName} · {isFull ? "Satu kali bayar" : "Cicilan"}
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${isOverdue ? "bg-coral/10 text-coral" : "bg-mint/10 text-mint"}`}>
          {isOverdue ? "Terlambat" : bill.status === "SETTLED" ? "Lunas" : "Aktif"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-xs text-muted-foreground">Tagihan termin ini</span>
          <strong className="text-lg tabular-nums text-foreground">{formatCurrency(bill.amountPerTerm)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-4" /> Jatuh tempo
          </span>
          <span className={isOverdue ? "text-sm font-semibold text-coral" : "text-sm font-medium text-foreground"}>
            {formatDueDate(bill.nextDueDate)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{bill.paidTerms}/{bill.totalTerms} termin dibayar</span>
          <span>{formatCurrency(remaining)} tersisa</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-high">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {isPayable ? (
        <button
          type="button"
          onClick={() => onPay(bill)}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <Banknote className="size-4" /> Bayar Tagihan
        </button>
      ) : null}
    </article>
  );
}
