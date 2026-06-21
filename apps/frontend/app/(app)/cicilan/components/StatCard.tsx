"use client";

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="px-5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-muted">
        {label}
      </p>
      <p className="text-[15px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
