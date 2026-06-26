"use client";

import { formatCurrency } from "@/lib/utils";

interface MonthlyPnLCardProps {
  income: number;
  expenses: number;
  isLoading?: boolean;
}

export function MonthlyPnLCard({ income, expenses, isLoading }: MonthlyPnLCardProps) {
  // Net Savings = Income - Expenses (atomic, no double-counting)
  const netSavings = income - expenses;

  return (
    <div
      style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid #262626",
        borderRadius: "8px",
        padding: "16px 20px",
      }}
    >
      {/* Title */}
      <span
        className="uppercase font-semibold"
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "10px",
          fontWeight: 600,
          color: "#bccabb",
          letterSpacing: "0.08em",
        }}
      >
        Monthly P&L
      </span>

      {isLoading ? (
        <div className="space-y-2 mt-3">
          {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded animate-pulse" style={{ backgroundColor: "#262626" }} />
          ))}
        </div>
      ) : (
        <div style={{ marginTop: "12px" }}>
          {/* Income row */}
          <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
            <div className="flex items-center gap-2">
              <div style={{ width: "5px", height: "5px", borderRadius: "9999px", backgroundColor: "#4ade80" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#bccabb" }}>Pemasukan</span>
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: "#4ade80" }}>
              {formatCurrency(income)}
            </span>
          </div>

          <div style={{ height: "1px", backgroundColor: "#262626" }} />

          {/* Expenses row */}
          <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
            <div className="flex items-center gap-2">
              <div style={{ width: "5px", height: "5px", borderRadius: "9999px", backgroundColor: "#ffb4ab" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#bccabb" }}>Pengeluaran</span>
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: "#ffb4ab" }}>
              {formatCurrency(expenses)}
            </span>
          </div>

          <div style={{ height: "1px", backgroundColor: "#262626" }} />

          {/* Net Savings row */}
          <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
            <div className="flex items-center gap-2">
              <div style={{ width: "5px", height: "5px", borderRadius: "9999px", backgroundColor: netSavings >= 0 ? "#4ade80" : "#ffb4ab" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#bccabb" }}>Net Savings</span>
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: netSavings >= 0 ? "#e5e2e1" : "#ffb4ab" }}>
              {formatCurrency(netSavings)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}