"use client";

import { formatCurrency } from "@/lib/utils";
export interface Installment {
  id: string;
  description: string | null;
  walletId: string;
  walletName: string;
  walletType: string;
  monthlyAmount: number;
  currentTerm: number;
  installmentMonths: number;
  totalAmount: number;
  status: "ACTIVE" | "SETTLED" | "CANCELLED";
  startDate: string;
  balanceDeducted: boolean;
}

interface InstallmentCardProps {
  installment: Installment;
}

export function InstallmentCard({ installment }: InstallmentCardProps) {
  // Compute due date
  const dueDate = new Date(installment.startDate);
  dueDate.setMonth(dueDate.getMonth() + installment.currentTerm);
  const today = new Date();
  const isOverdue = dueDate < today;
  const isUpcoming = !isOverdue && dueDate > today && dueDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Compute progress percentage
  const progress = installment.installmentMonths > 0 ? 
    Math.min(100, Math.round((installment.currentTerm / installment.installmentMonths) * 100)) : 0;

  // Determine status color for accent bar
  let statusColor = "#10B981";
  if (isOverdue) statusColor = "#EF4444";
  else if (isUpcoming) statusColor = "#F59E0B";

  // Determine badge text
  const badgeText = isUpcoming ? "UPCOMING" : "";

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 relative overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1E293B]" style={{ borderLeftColor: statusColor }} />

      {/* Main content */}
      <div className="flex flex-col h-full">
        {/* Icon + Name + Meta */}
        <div className="flex items-start gap-3">
          {/* Icon box */}
          <div className="flex items-center justify-center h-10 w-10 rounded-lg border border-[#334155] bg-[#0F172A]">
            <span className="text-[16px] text-text-muted" aria-hidden="true">
              {/* Use category-based icon if possible, fallback to receipt */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>

          {/* Name */}
          <p className="text-text-primary font-medium text-[14px]">
            {installment.walletName}
            {badgeText && (
              <span className="inline-block ml-2 rounded-full text-[10px] font-semibold px-2 py-1 bg-warning text-primary">
                UPCOMING
              </span>
            )}
          </p>

          {/* Meta */}
          <p className="text-[11px] text-text-muted mt-1">
            {installment.walletType} · Source Wallet · Monthly
          </p>
        </div>

        {/* Amount + Period */}
        <div className="mt-2 flex-1 justify-between">
          {/* Amount */}
          <p className="font-semibold text-[15px] text-[font-hanken]">
            {installment.monthlyAmount > 0 ? formatCurrency(installment.monthlyAmount) : "—"}
          </p>

          {/* Period */}
          <p className="text-[11px] text-text-muted">
            {installment.currentTerm} / {installment.installmentMonths} months
          </p>
        </div>

        {/* Progress row */}
        <div className="mt-1 flex justify-between text-[11px] text-text-muted">
          <span>Bulan {installment.currentTerm} dari {installment.installmentMonths}</span>
          <span>Rp {formatCurrency(installment.totalAmount)} tersisa</span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 rounded-full bg-[#334155]">
          <div
            className="h-full rounded"
            style={{ width: `${progress}%`, backgroundColor: progress < 50 ? "#10B981" : progress <= 80 ? "#F59E0B" : "#38BDF8" }}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-[#1E293B] border border-[#334155] text-text-primary text-[12px] font-medium hover:bg-[#334155]">
            Lihat Detail
          </button>
          {installment.status === "ACTIVE" ? (
            <button className="px-4 py-2 rounded bg-[#1E293B] border border-[#334155] text-text-primary text-[12px] font-medium hover:bg-[#334155]" onClick={() => {/* call settle API */}}>
              Lunasi Sekarang
            </button>
          ) : (
            <button className="px-4 py-2 rounded bg-[#EF4444] text-[#EF4444] text-[12px] font-medium hover:bg-[#EF4444]">
              Batalkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}