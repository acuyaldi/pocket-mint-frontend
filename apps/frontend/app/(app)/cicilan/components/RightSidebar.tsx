"use client";

import { JatuhTempoCard } from "./JatuhTempoCard.tsx";
import { OutstandingLiabilityCard } from "./OutstandingLiabilityCard.tsx";
import { ActiveInstallmentsWidget } from "./ActiveInstallmentsWidget.tsx";

interface RightSidebarProps {
  activeCount: number;
  totalRemaining: number;
  nearestDue: Date | null;
}

export function RightSidebar({ activeCount, totalRemaining, nearestDue }: RightSidebarProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 p-4 border border-[#334155] rounded-2xl">
      {/* Active Installments Widget */}
      <ActiveInstallmentsWidget
        total={activeCount}
        remaining={totalRemaining}
      />

      {/* Outstanding Liability Card */}
      <OutstandingLiabilityCard
        total={totalRemaining}
      />

      {/* Jatuh Tempo Card */}
      <JatuhTempoCard
        nearestDue={nearestDue ? nearestDue.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
      />
    </div>
  );
}
