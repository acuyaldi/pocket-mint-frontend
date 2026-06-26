"use client";

import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface NetWorthHeroProps {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  trendPercent?: number;
  isLoading?: boolean;
}

export function NetWorthHero({
  netWorth,
  totalAssets,
  totalDebts,
  trendPercent,
  isLoading,
}: NetWorthHeroProps) {
  return (
    <div
      className="w-full"
      style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid #262626",
        borderRadius: "8px",
        padding: "20px",
      }}
    >
      {/* Label */}
      <span
        className="block uppercase font-semibold"
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "10px",
          fontWeight: 600,
          color: "#bccabb",
          letterSpacing: "0.1em",
        }}
      >
        TOTAL NET WORTH
      </span>

      {/* Amount */}
      {isLoading ? (
        <div className="h-10 w-48 rounded animate-pulse mt-2" style={{ backgroundColor: "#262626" }} />
      ) : (
        <p
          style={{
            fontFamily: "var(--font-hanken)",
            fontSize: "48px",
            fontWeight: 700,
            color: "#4ade80",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            marginTop: "8px",
          }}
        >
          {formatCurrency(netWorth)}
        </p>
      )}

      {/* Badge */}
      {trendPercent !== undefined && (
        <div
          className="inline-flex items-center gap-1"
          style={{
            marginTop: "12px",
            borderRadius: "9999px",
            padding: "3px 8px",
            backgroundColor: trendPercent >= 0 ? "rgba(74, 222, 128, 0.12)" : "rgba(255, 180, 171, 0.12)",
            border: trendPercent >= 0 ? "1px solid #4ade80" : "1px solid #ffb4ab",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 600,
            color: trendPercent >= 0 ? "#4ade80" : "#ffb4ab",
          }}
        >
          <TrendingUp className="size-3" />
          <span>{trendPercent >= 0 ? "+" : ""}{trendPercent.toFixed(1)}% bulan ini</span>
        </div>
      )}

      {/* Meta items row */}
      <div className="flex items-center gap-7" style={{ paddingTop: "12px" }}>
        {/* Total Aset */}
        <div>
          <p
            className="uppercase font-semibold"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "10px",
              fontWeight: 600,
          color: "#bccabb",
              letterSpacing: "0.05em",
            }}
          >
            Total Aset
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: "#e5e2e1", marginTop: "4px" }}>
            {formatCurrency(totalAssets)}
          </p>
        </div>

        {/* Total Utang */}
        <div>
          <p
            className="uppercase font-semibold"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "10px",
              fontWeight: 600,
          color: "#bccabb",
              letterSpacing: "0.05em",
            }}
          >
            Total Utang
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: "#ffb4ab", marginTop: "4px" }}>
            {formatCurrency(totalDebts)}
          </p>
        </div>

        {/* Net Savings */}
        <div>
          <p
            className="uppercase font-semibold"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "10px",
              fontWeight: 600,
          color: "#bccabb",
              letterSpacing: "0.05em",
            }}
          >
            Net Savings
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: (totalAssets - totalDebts) >= 0 ? "#e5e2e1" : "#ffb4ab", marginTop: "4px" }}>
            {formatCurrency(totalAssets - totalDebts)}
          </p>
        </div>
      </div>
    </div>
  );
}
