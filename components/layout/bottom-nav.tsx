"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CalendarClock,
  BarChart3,
  User,
} from "lucide-react";
import { AccountMenuItems } from "./account-menu";
import { DockMorph, type DockMorphItemData } from "@/components/ui/dock-morph";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDueBillCount } from "@/src/features/bills/hooks/useBills";

// Labels and order mirror the desktop sidebar (app-sidebar.tsx) — same
// vocabulary on both surfaces so wayfinding transfers between devices
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Dompet", href: "/wallets", icon: Wallet },
  { label: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
  { label: "Cicilan", href: "/tagihan", icon: CalendarClock },
  { label: "Analitik", href: "/analytics", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();
  const dueBillCount = useDueBillCount();
  const items = React.useMemo<DockMorphItemData[]>(() => {
    const navItems: DockMorphItemData[] = NAV_ITEMS.map((item) => {
      const isActive =
        pathname === item.href || pathname.startsWith(item.href + "/");
      const Icon = item.icon;

      return {
        key: item.href,
        label: item.label,
        href: item.href,
        isActive,
        icon: (
          <span className="relative inline-flex">
            <Icon className="size-[18px]" />
            {item.href === "/tagihan" && dueBillCount > 0 ? (
              <span
                aria-label={`${dueBillCount} cicilan perlu diperhatikan`}
                className="absolute -right-3 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[9px] font-bold leading-4 text-white"
              >
                {dueBillCount > 9 ? "9+" : dueBillCount}
              </span>
            ) : null}
          </span>
        ),
      };
    });

    navItems.push({
      key: "account",
      label: "Akun",
      icon: <User className="size-[18px]" />,
      renderTrigger: ({ defaultTrigger }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={defaultTrigger as React.ReactElement} />
          <DropdownMenuContent side="top" align="end" sideOffset={10}>
            <AccountMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return navItems;
  }, [dueBillCount, pathname]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 px-3 md:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 0.625rem)",
      }}
    >
      <DockMorph
        aria-label="Main"
        items={items}
        wrapperClassName="w-full justify-center"
        className="w-full max-w-[min(100%,22rem)]"
      />
    </div>
  );
}
