"use client";

import { formatCurrency } from "@/lib/utils";

interface OutstandingLiabilityCardProps {
  total: number;
}

export function OutstandingLiabilityCard({ total }: OutstandingLiabilityCardProps) {
  return (
    <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text-muted">
        Outstanding Liability
      </p>
      <p className="mt-3 text-[18px] font-bold text-text-primary" style={{ fontFamily: "var(--font-hanken)" }}>
        {formatCurrency(total)}
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        Total sisa semua cicilan
      </p>
      <div className="mt-3 border-t border-[#334155] pt-2">
        <div className="flex justify-between text-[12px] text-text-muted">
          <span>Pokok</span>
          <span>{formatCurrency(total * 0.7)}</span> {/* Example: 70% principal */}
        </div>
        <div className="flex justify-between text-[12px] text-text-muted mt-2">
          <span>Bunga</span>
          <span>{formatCurrency(total * 0.3)}</span> {/* Example: 30% interest */}
        </div>
      </div>
    </div>
  );
}
