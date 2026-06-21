"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Sparkline } from "./Sparkline.tsx";
import { StatCard } from "./StatCard.tsx";
import { formatCurrency } from "@/lib/utils";

interface HeroCardProps {
  total: number;
  trendData: number[];
  activeCount: number;
  totalRemaining: number;
  nearestDue: Date | null;
  status: { text: string; color: string };
}

export function HeroCard({ total, trendData, activeCount, totalRemaining, nearestDue, status }: HeroCardProps) {
  const trend = useMemo(() => {
    if (trendData.length < 2) return null;
    const first = trendData[0];
    const last = trendData[trendData.length - 1];
    const diff = first - last;
    const pct = first === 0 ? 0 : Math.round((diff / first) * 100);
    return {
      isLower: diff > 0,
      pct: Math.abs(pct),
    };
  }, [trendData]);

  return (
    <div className="rounded-xl border border-[#334155] bg-[#1E293B] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-muted">
            TOTAL BEBAN CICILAN / BULAN
          </p>
          <p className="text-[32px] font-semibold leading-none text-text-primary tracking-[-0.5px]" style={{ fontFamily: "var(--font-hanken)" }}>
            {formatCurrency(total)}
          </p>
          {trend && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium" style={{ backgroundColor: trend.isLower ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)", borderColor: trend.isLower ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: trend.isLower ? "#10B981" : "#EF4444" }}>
              {trend.isLower ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
              <span>{trend.pct}% {trend.isLower ? "lebih rendah" : "lebih tinggi"} dari bulan lalu</span>
            </div>
          )}
        </div>
        <div className="w-45 h-12">
          <Sparkline data={trendData} />
        </div>
      </div>

      <div className="mt-5 flex border-t border-[#334155] pt-4">
        <StatCard label="CICILAN AKTIF" value={String(activeCount)} color="#38BDF8" />
        <StatCard label="TOTAL SISA HUTANG" value={formatCurrency(totalRemaining)} color="#F8FAFC" />
        <StatCard label="JATUH TEMPO TERDEKAT" value={nearestDue ? nearestDue.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—"} color="#F8FAFC" />
        <StatCard label="STATUS" value={status.text} color={status.color} />
      </div>
    </div>
  );
}
