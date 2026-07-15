"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  User,
  Wallet,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { PocketMintLogo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Dompet", href: "/wallets", icon: Wallet },
  { label: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
  { label: "Cicilan", href: "/cicilan", icon: CalendarClock },
  { label: "Analitik", href: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [accountLabel, setAccountLabel] = useState("Akun");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return;
      const meta = user.user_metadata ?? {};
      setAccountLabel(meta.full_name || meta.name || user.email || "Akun");
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    const result = await logout();
    if (result?.error) {
      console.error("Logout failed:", result.error);
    }
  }

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col gap-2 border-r border-border bg-background p-4 md:flex">
      <div className="mb-8 px-4">
        <PocketMintLogo wrapperClassName="text-primary" />
      </div>

      <nav aria-label="Navigasi utama" className="flex-grow space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}

      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <Link
          href="/profile"
          className="mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-foreground transition-colors hover:bg-surface-high"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-4" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-semibold">
              {accountLabel}
            </span>
            <span className="block text-xs text-muted-foreground">
              Pengaturan Akun
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
