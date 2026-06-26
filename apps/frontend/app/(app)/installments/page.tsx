"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useInstallments } from "@/src/features/installments/hooks/useInstallments";
import type { Installment } from "@/src/types/installment";
import { formatRp } from "@/lib/utils";
import { WalletSummaryCard } from "@/components/WalletSummaryCard";
import { CreateInstallmentModal } from "@/components/CreateInstallmentModal";
import { InstallmentCard } from "@/components/InstallmentCard";
import { ActiveInstallmentsWidget } from "@/components/dashboard/ActiveInstallmentsWidget";
import { OutstandingLiabilityCard } from "@/components/OutstandingLiabilityCard";
import { JatuhTempoCard } from "@/components/JatuhTempoCard";

const DEBT_TYPES = ["CREDIT_CARD", "LOAN_PAYLATER"];

// Derived financial aggregates
function computeAggregates(installments: Installment[]) {
  const active = installments.filter(i => i.status === "ACTIVE");
  const settled = installments.filter(i => i.status === "SETTLED");
  const cancelled = installments.filter(i => i.status === "CANCELLED");

  const totalActive = active.reduce((s, i) => s + i.monthlyAmount, 0);
  const totalRemaining = active.reduce((s, i) => s + (i.totalAmount - i.balanceDeducted ? i.monthlyAmount : 0), 0);
  const nearestDue = active.reduce((earliest, i) => {
    const dueDate = new Date(i.startDate);
    dueDate.setMonth(dueDate.getMonth() + i.currentTerm);
    return earliest ? (dueDate < earliest ? dueDate : earliest) : dueDate;
  }, null);

  return {
    totalActive, totalRemaining, nearestDue
  };
}

// Filter Pills
const FILTERS = [
  { key: "all", label: "All Installments" },
  { key: "active", label: "Active" },
  { key: "settled", label: "Settled" },
  { key: "cancelled", label: "Cancelled" }
];

// Animation Variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

// Main Page
export default function InstallmentsPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: installments } = useInstallments();

  const allInstallments = useMemo(() => (installments ?? []).filter(i => !i.isArchived), [installments]);
  const agg = useMemo(() => computeAggregates(allInstallments), [allInstallments]);

  const filteredInstallments = useMemo(() => {
    if (filter === "all") return allInstallments;
    if (filter === "active") return allInstallments.filter(i => i.status === "ACTIVE");
    if (filter === "settled") return allInstallments.filter(i => i.status === "SETTLED");
    return allInstallments.filter(i => i.status === "CANCELLED");
  }, [filter, allInstallments]);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible">
      {/* Header Stats Grid */}
      <div class="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Active Installments Widget */}
        <ActiveInstallmentsWidget
          total={agg.totalActive}
          remaining={agg.totalRemaining}
        />

        {/* Outstanding Liability Card */}
        <OutstandingLiabilityCard
          total={agg.totalRemaining}
        />

        {/* Jatuh Tempo Card */}
        <JatuhTempoCard
          nearestDue={agg.nearestDue ? agg.nearestDue.toLocaleDateString("id-ID") : "-"}
        />
      </div>

      {/* Filter Bar */}
      <motion.div variants={pageVariants} class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex gap-1 p-1 rounded-lg" style="background-color: #1E293B; border: 1px solid #334155">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
              style={{ backgroundColor: filter === f.key ? "#334155" : "transparent", color: filter === f.key ? "#F8FAFC" : "#94A3B8", fontFamily: "var(--font-inter)" }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div class="flex items-center gap-3">
          <button
            onClick={() => setIsCustomModalOpen(true)}
            class="font-semibold h-9 px-5 gap-2 rounded-lg"
            style="background-color: #38BDF8; color: #0F172A"
          >
            <Plus className="size-4" /> Add New Installment
          </button>
        </div>
      </motion.div>

      {/* Installment Cards Grid */}
      <motion.div variants={pageVariants} key={filter} style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px">
        {filteredInstallments.map(installment => (
          <InstallmentCard
            key={installment.id}
            installment={installment}
            variant="full"
          />
        ))}
      </motion.div>

      {/* Create New Installment Modal */}
      <CreateInstallmentModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSuccess={handleInstallmentCreateSuccess}
      />
    </motion.div>
  );
}

// Handle installment creation success
const handleInstallmentCreateSuccess = (formData: any) => {
  console.log("=== NEW INSTALLMENT CREATED SUCCESS ===", formData);
};