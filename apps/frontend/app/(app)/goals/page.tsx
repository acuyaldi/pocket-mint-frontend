"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { useGoals, type Goal } from "@/src/features/goals/hooks/useGoals";
import { GoalCard } from "./components/GoalCard";
import GoalModal from "./components/GoalModal";

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const openCreate = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };
  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full min-h-full flex flex-col gap-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Goals</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Target tabungan dan progresnya
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110 active:scale-95 cursor-pointer"
          style={{ backgroundColor: "#4ade80", color: "#003919" }}
        >
          <Plus className="size-4" />
          Add Goal
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl h-[180px] bg-card border border-border" />
          ))}
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={openEdit} />
          ))}
        </div>
      ) : (
        <button
          onClick={openCreate}
          className="flex flex-col items-center justify-center gap-3 rounded-xl py-16 border border-dashed border-border bg-card transition-opacity hover:opacity-75 cursor-pointer"
        >
          <Target className="size-8 text-primary" />
          <p className="text-sm font-semibold text-foreground">Belum ada goal</p>
          <p className="text-[12px] text-muted-foreground">
            Buat target tabungan pertamamu
          </p>
        </button>
      )}

      <GoalModal
        isOpen={isModalOpen}
        goal={editingGoal}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
