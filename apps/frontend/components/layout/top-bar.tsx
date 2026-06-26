"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transaksi",
  "/wallets": "Wallets",
  "/cicilan": "Cicilan",
};

interface TopBarProps {
  userName?: string;
  userEmail?: string;
}

export function TopBar({}: TopBarProps) {
  const pathname = usePathname();

  const title =
    Object.entries(PAGE_TITLES).find(
      ([href]) => pathname === href || pathname.startsWith(href + "/")
    )?.[1] ?? "Pocket Mint";


  return (
    <header
      className="flex justify-between items-center w-full mb-6 border-b border-[#1a1a1a] pb-4"
    >
      {/* Left: Page Title + subtitle */}
      <div>
        <h2
          className="text-[18px] font-semibold tracking-tight"
          style={{ color: "#e5e2e1", fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
        <p className="text-[11px]" style={{ color: "#bccabb", fontFamily: "var(--font-sans)" }}>
          Welcome back! Here&rsquo;s your financial summary.
        </p>
      </div>

      {/* Right: Bell */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          className="relative flex items-center justify-center rounded-lg transition-colors"
          style={{ width: "32px", height: "32px" }}
          aria-label="Notifikasi"
        >
          <Bell className="size-5" style={{ color: "#bccabb" }} />
          <span
            className="absolute top-0.5 right-0.5 size-4 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              backgroundColor: "#4ade80",
              color: "#003919",
              fontFamily: "var(--font-mono)",
            }}
          >
            3
          </span>
        </button>
      </div>
    </header>
  );
}