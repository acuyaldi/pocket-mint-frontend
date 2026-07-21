"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  Gauge,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  User,
  Wallet,
} from "lucide-react";
import { PocketMintLogo } from "@/components/Logo";
import { useLogout } from "@/components/LogoutProvider";
import { createClient } from "@/lib/supabase/client";
import { useDueBillCount } from "@/src/features/bills/hooks/useBills";

export function AppSidebar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const dueBillCount = useDueBillCount();
  const { handleLogout } = useLogout();
  const [accountLabel, setAccountLabel] = useState(t("account"));

  const NAV_ITEMS = [
    { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("wallets"), href: "/wallets", icon: Wallet },
    { label: t("transactions"), href: "/transactions", icon: ArrowLeftRight },
    { label: t("installments"), href: "/tagihan", icon: CalendarClock },
    { label: t("analytics"), href: "/analytics", icon: BarChart3 },
    { label: t("savingGoals"), href: "/target-tabungan", icon: PiggyBank },
    { label: t("budgets"), href: "/anggaran", icon: Gauge },
  ];

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return;
      const meta = user.user_metadata ?? {};
      setAccountLabel(meta.full_name || meta.name || user.email || t("account"));
    });

    return () => {
      active = false;
    };
  }, [t]);

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col gap-2 border-r border-border bg-background p-4 md:flex">
      <div className="mb-8 px-4">
        <PocketMintLogo wrapperClassName="text-primary" />
        <p className="mt-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
          {tCommon("workspaceTagline")}
        </p>
      </div>

      <nav aria-label={t("ariaMain")} className="flex-grow space-y-1">
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
              {item.href === "/tagihan" && dueBillCount > 0 ? (
                <span
                  aria-label={t("dueBillsAria", { count: dueBillCount })}
                  className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                >
                  {dueBillCount > 9 ? "9+" : dueBillCount}
                </span>
              ) : null}
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
              {t("accountSettings")}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-5" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
