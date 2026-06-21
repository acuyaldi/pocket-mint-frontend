"use client";

interface JatuhTempoCardProps {
  nearestDue: string;
}

export function JatuhTempoCard({ nearestDue }: JatuhTempoCardProps) {
  return (
    <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text-muted">
        Jatuh Tempo
      </p>
      <p className="mt-3 text-[18px] font-bold text-text-primary" style={{ fontFamily: "var(--font-hanken)" }}>
        {nearestDue}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] text-text-muted">
          {nearestDue === "—" ? "Tidak ada cicilan" : nearestDue}
        </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#334155] px-2 py-1 text-[10px] text-text-muted">
          {"↗"}
        </span>
      </div>
    </div>
  );
}