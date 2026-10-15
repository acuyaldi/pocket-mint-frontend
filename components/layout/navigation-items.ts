import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  Gauge,
  LayoutDashboard,
  PiggyBank,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { HIDE_SAVING_GOALS_NAVIGATION } from "@/components/layout/navigation-visibility";

export interface AppNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function getAppNavigationItems(t: (key: string) => string): AppNavigationItem[] {
  const items: AppNavigationItem[] = [
    { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("wallets"), href: "/wallets", icon: Wallet },
    { label: t("transactions"), href: "/transactions", icon: ArrowLeftRight },
    { label: t("installments"), href: "/tagihan", icon: CalendarClock },
    { label: t("analytics"), href: "/analytics", icon: BarChart3 },
    { label: t("savingGoals"), href: "/target-tabungan", icon: PiggyBank },
    { label: t("budgets"), href: "/anggaran", icon: Gauge },
    { label: t("assistant"), href: "/assistant", icon: Sparkles },
  ];

  if (!HIDE_SAVING_GOALS_NAVIGATION) return items;

  return items.filter((item) => item.href !== "/target-tabungan");
}
