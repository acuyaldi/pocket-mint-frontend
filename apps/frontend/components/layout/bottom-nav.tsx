"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CalendarClock,
  Target,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wallets", href: "/wallets", icon: Wallet },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Cicilan", href: "/cicilan", icon: CalendarClock },
  { label: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 h-14 z-20 flex items-center justify-around"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        backgroundColor: "#131313",
        borderTop: "1px solid #262626",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150"
            style={{
              color: isActive ? "#4ade80" : "#bccabb",
              fontWeight: "500",
            }}
          >
            <Icon className="size-[18px]" />
            <span
              className="text-[10px] leading-none"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
