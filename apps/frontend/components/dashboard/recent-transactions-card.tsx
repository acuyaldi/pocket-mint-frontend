"use client";

import {  ShoppingBag, ArrowUpRight, RefreshCcw } from "lucide-react";
import Link from "next/link";
import type { Transaction } from "@/components/dashboard/transaction-table";
import { formatCurrency } from "@/lib/utils";

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

function getTxIcon(type: string) {
  const t = type.toLowerCase();
  if (t === "income") return ArrowUpRight;
  if (t === "expense") return ShoppingBag;
  return RefreshCcw;
}

function getTxConfig(type: string) {
  const t = type.toLowerCase();
  if (t === "income") {
    return {
      iconBg: "rgba(74, 222, 128, 0.1)",
      iconColor: "#4ade80",
      amountColor: "#4ade80",
      prefix: "+",
    };
  }
  if (t === "expense") {
    return {
      iconBg: "rgba(255, 180, 171, 0.1)",
      iconColor: "#ffb4ab",
      amountColor: "#ffb4ab",
      prefix: "-",
    };
  }
  return {
    iconBg: "rgba(74, 222, 128, 0.1)",
    iconColor: "#4ade80",
    amountColor: "#4ade80",
    prefix: "",
  };
}

const RECENT_LIMIT = 5;

export function RecentTransactionsCard({
  transactions,
  isLoading,
}: RecentTransactionsCardProps) {
  const recent = transactions.slice(0, RECENT_LIMIT);

  return (
    <div
      style={{ backgroundColor: "#0e0e0e", border: "1px solid #262626", borderRadius: "8px", padding: "16px 20px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
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
          Transaksi Terbaru
        </span>
        <Link href="/transactions">
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 600, color: "#4ade80" }}>
            Lihat semua \u2192
          </span>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: "#262626" }} />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "#bccabb", textAlign: "center", padding: "24px 0" }}>No transactions yet.</p>
      ) : (
        <div>
          {recent.map((tx, index) => {
            const Icon = getTxIcon(tx.type);
            const cfg = getTxConfig(tx.type);
            const category =
              typeof tx.category === "string"
                ? tx.category
                : tx.category?.name ?? "General";
            const date = new Date(tx.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            });

            return (
              <div key={tx.id}>
                <div className="flex items-center justify-between" style={{ padding: "8px 0" }}>
                  {/* Left: icon + name + meta */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: cfg.iconBg,
                      }}
                    >
                      <Icon className="size-3.5" style={{ color: cfg.iconColor }} />
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 500, color: "#e5e2e1" }} className="truncate">
                        {tx.description ?? "Untitled"}
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#bccabb", marginTop: "1px" }}>
                        {date} \u00b7 {category}
                      </p>
                    </div>
                  </div>

                  {/* Right: amount + wallet — jangan flex-shrink */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500, color: cfg.amountColor }}>
                      {cfg.prefix}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
                {index < recent.length - 1 && (
                  <div style={{ height: "1px", backgroundColor: "#262626" }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}