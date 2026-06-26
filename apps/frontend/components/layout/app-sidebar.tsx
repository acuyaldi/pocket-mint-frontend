"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CalendarClock,
  LogOut,
  Loader2,
} from "lucide-react";
import { PocketMintLogo } from "../Logo";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wallets", href: "/wallets", icon: Wallet },
  { label: "Cicilan", href: "/cicilan", icon: CalendarClock },
  { label: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
];

interface AppSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function AppSidebar({
  userName = "User",
  userEmail = "user@pocketmint.com",
}: AppSidebarProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 w-[240px] h-full bg-surface"
      style={{
        borderRight: "1px solid #262626",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5"
        style={{ height: "56px", padding: "16px 20px", borderBottom: "1px solid #1a1a1a", color: "#e5e2e1" }}
      >
        <PocketMintLogo />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 transition-all duration-150"
              style={{
                padding: "8px 20px",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                fontWeight: "500",
                color: isActive ? "#4ade80" : "#bccabb",
                backgroundColor: isActive
                  ? "rgba(74, 222, 128, 0.08)"
                  : "transparent",
                borderRight: isActive
                  ? "2px solid #4ade80"
                  : "2px solid transparent",
              }}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info - pinned bottom */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="size-[28px] rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{
              backgroundColor: "rgba(74, 222, 128, 0.15)",
              color: "#4ade80",
              fontFamily: "var(--font-heading)",
            }}
          >
            {initials}
          </div>

          {/* Name + Email */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[13px] font-medium truncate"
              style={{ fontFamily: "var(--font-sans)", color: "#e5e2e1" }}
            >
              {userName}
            </p>
            <p
              className="text-[10px] truncate"
              style={{ fontFamily: "var(--font-sans)", color: "#bccabb" }}
            >
              {userEmail}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-muted-foreground hover:text-destructive transition-colors duration-150 disabled:opacity-50 shrink-0"
            title="Keluar"
          >
            {loggingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
