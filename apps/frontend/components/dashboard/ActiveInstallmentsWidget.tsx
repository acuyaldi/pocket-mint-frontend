"use client";

import Link from "next/link";
import { CreditCard, Receipt, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  useInstallments,
  Installment,
} from "@/src/features/installments/hooks/useInstallments";

const WALLET_ICON_MAP: Record<string, typeof CreditCard> = {
  CREDIT_CARD: CreditCard,
  LOAN_PAYLATER: Receipt,
};

const MAX_DISPLAY = 3;

function InstallmentRow({ item }: { item: Installment }) {
  const Icon = WALLET_ICON_MAP[item.walletType] ?? CreditCard;
  const percent = Math.min(
    Math.round((item.currentTerm / item.installmentMonths) * 100),
    100
  );

  return (
    <div className="space-y-1" style={{ padding: "10px 12px", borderRadius: "6px", backgroundColor: "#0e0e0e" }}>
      {/* Top row: name + counter */}
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: "#e5e2e1" }}>
          {item.walletName}
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#bccabb" }}>
          {item.currentTerm}/{item.installmentMonths}
        </span>
      </div>

      {/* Subtitle */}
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#bccabb" }}>
        {formatCurrency(Math.round(item.monthlyAmount))}/bulan · {item.walletType === "CREDIT_CARD" ? "Credit Card" : "Paylater"}
      </p>

      {/* Progress bar */}
      <div style={{ height: "3px", backgroundColor: "#262626", borderRadius: "9999px", overflow: "hidden", marginTop: "6px" }}>
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: "9999px",
            backgroundColor: percent >= 80 ? "#ffb4ab" : percent >= 30 ? "#facc15" : "#4ade80",
          }}
        />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#bccabb" }}>{percent}% lunas</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#bccabb" }}>{item.installmentMonths - item.currentTerm} cicilan lagi</span>
      </div>
    </div>
  );
}

export function ActiveInstallmentsWidget() {
  const { data, isLoading } = useInstallments("ACTIVE");
  const installments = data ?? [];
  const displayItems = installments.slice(0, MAX_DISPLAY);

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
          Cicilan Aktif
        </span>
        {installments.length > 0 && (
          <Link href="/cicilan">
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 600, color: "#4ade80" }}>
              Lihat semua \u2192
            </span>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded animate-pulse" style={{ backgroundColor: "#262626" }} />
          ))}
        </div>
      ) : installments.length === 0 ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "#bccabb", textAlign: "center", padding: "24px 0" }}>
          Tidak ada cicilan aktif \ud83c\udf89
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: "8px" }}>
          {displayItems.map((item, index) => (
            <div key={item.id}>
              <InstallmentRow item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}