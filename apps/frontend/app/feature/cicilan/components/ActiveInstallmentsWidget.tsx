"use client";

interface ActiveInstallmentsWidgetProps {
  total: number;
  remaining: number;
}

export function ActiveInstallmentsWidget({ total }: ActiveInstallmentsWidgetProps) {
  return (
    <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text-muted">
        Active Commitments
      </p>
      <p className="mt-3 text-[36px] font-bold leading-none text-brand" style={{ fontFamily: "var(--font-hanken)" }}>
        {total}
      </p>
      <p className="mt-1 text-[12px] text-text-muted">
        cicilan berjalan
      </p>
    </div>
  );
}
