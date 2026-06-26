"use client";

import type { Wallet } from "@/src/types/wallet";
import { Landmark, CreditCard, Receipt, Banknote, Smartphone, LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface WalletOverviewGridProps {
  wallets: Wallet[];
  isLoading?: boolean;
  onAddWallet?: () => void;
}


const WALLET_ICON_MAP: Record<string, LucideIcon> = {
  CASH: Banknote,
  BANK: Landmark,
  E_WALLET: Smartphone,
  CREDIT_CARD: CreditCard,
  LOAN_PAYLATER: Receipt,
};


// ── Individual wallet card ──────────────────────────────────────────────────────
function WalletCard({ wallet }: { wallet: Wallet }) {
  const Icon = WALLET_ICON_MAP[wallet.type] ?? Banknote;
  const isDebt = wallet.type === "CREDIT_CARD" || wallet.type === "LOAN_PAYLATER";
  const hasCreditLimit = wallet.creditLimit > 0;

  // Credit card: show "Credit Used" = |balance|, utilization = |balance| / limit * 100
  const creditUsed = isDebt ? Math.abs(wallet.balance) : 0;
  const utilization = hasCreditLimit
    ? Math.min(Math.round((creditUsed / wallet.creditLimit) * 100), 100)
    : 0;

  // For asset wallets just show balance
  if (!isDebt) {
    return (
      <div
        style={{ backgroundColor: "#0e0e0e", border: "1px solid #262626", borderRadius: "8px", padding: "16px" }}
      >
        {/* Top section: icon + name + type */}
        <div className="flex items-center gap-2" style={{ marginBottom: "8px" }}>
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(74, 222, 128, 0.1)",
            }}
          >
            <Icon className="size-4" style={{ color: "#4ade80" }} />
          </div>
          <div className="min-w-0">
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: "#e5e2e1" }}>
              {wallet.name}
            </p>
            <p className="uppercase" style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "#bccabb" }}>
              {wallet.type.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Amount */}
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: "#e5e2e1" }}>
          {formatCurrency(wallet.balance)}
        </p>

        {/* Detail text */}
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "#bccabb", marginTop: "4px" }}>
          Saldo tersedia
        </p>
      </div>
    );
  }

  // Debt wallets: Credit Card or Paylater
  return (
      <div
        style={{ backgroundColor: "#0e0e0e", border: "1px solid #262626", borderRadius: "8px", padding: "16px" }}
    >
      {/* Top section: icon + name + type */}
      <div className="flex items-center gap-2" style={{ marginBottom: "8px" }}>
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 180, 171, 0.1)",
          }}
        >
            <Icon className="size-4" style={{ color: "#ffb4ab" }} />
        </div>
        <div className="min-w-0">
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: "#e5e2e1" }}>
            {wallet.name}
          </p>
          <p className="uppercase" style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "#bccabb" }}>
            {wallet.type.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Amount - red for debt */}
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: "#ffb4ab", marginBottom: "4px" }}>
        {formatCurrency(creditUsed)}
      </p>

      {/* Detail text */}
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "#bccabb" }}>
        Sisa limit: {formatCurrency(wallet.creditLimit - creditUsed)}
      </p>

      {/* Utilization bar for credit cards */}
      {wallet.type === "CREDIT_CARD" && hasCreditLimit && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              height: "3px",
              backgroundColor: "#262626",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${utilization}%`,
                height: "100%",
                borderRadius: "9999px",
                backgroundColor: utilization >= 80 ? "#ffb4ab" : utilization >= 30 ? "#facc15" : "#4ade80",
              }}
            />
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "#bccabb", marginTop: "4px" }}>
            Utilisasi {utilization}%
          </p>
        </div>
      )}
    </div>
  );
}

export function WalletOverviewGrid({ wallets, isLoading, onAddWallet }: WalletOverviewGridProps) {
  // Show up to 4 wallets max, split into separate cards side by side
  const displayWallets = wallets.filter((w) => !w.isArchived).slice(0, 4);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2" style={{ gap: "12px" }}>
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded animate-pulse" style={{ backgroundColor: "#262626", border: "1px solid #262626" }} />
        ))}
      </div>
    );
  }

  if (displayWallets.length === 0) {
    return (
      <div
        className="flex flex-col items-center"
        style={{
          backgroundColor: "#0e0e0e",
          border: "1px solid #262626",
          borderRadius: "8px",
          padding: "16px",
          gap: "12px",
        }}
      >
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "#bccabb" }}>No wallets yet.</p>
        {onAddWallet && (
          <button
            onClick={onAddWallet}
            style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, color: "#4ade80" }}
            className="hover:underline"
          >
            + Add your first wallet
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2" style={{ gap: "12px" }}>
      {displayWallets.map((w) => (
        <WalletCard key={w.id} wallet={w} />
      ))}
    </div>
  );
}