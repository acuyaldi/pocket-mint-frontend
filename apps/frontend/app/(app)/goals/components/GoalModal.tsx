"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateGoal, useUpdateGoal, type Goal } from "@/src/features/goals/hooks/useGoals";

const labelStyle = {
  color: "#3d4a3e",
  fontFamily: "var(--font-inter)",
} as const;
const inputStyle = {
  backgroundColor: "#0e0e0e",
  border: "1px solid #262626",
  color: "#e5e2e1",
} as const;

interface GoalModalProps {
  isOpen: boolean;
  goal: Goal | null; // null = create mode
  onClose: () => void;
}

export default function GoalModal({ isOpen, goal, onClose }: GoalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        style={{ backgroundColor: "#131313", border: "1px solid #262626" }}
      >
        {/* Radix unmounts content on close, so form state resets naturally */}
        <GoalForm goal={goal} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function GoalForm({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isEdit = !!goal;
  const isPending = createGoal.isPending || updateGoal.isPending;

  const [name, setName] = useState(goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : "");
  const [savedAmount, setSavedAmount] = useState(goal ? String(goal.savedAmount) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ? goal.deadline.slice(0, 10) : "");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      name: name.trim(),
      targetAmount: Number(targetAmount) || 0,
      deadline: deadline || null,
      ...(isEdit && { savedAmount: Number(savedAmount) || 0 }),
    };
    try {
      if (isEdit && goal) {
        await updateGoal.mutateAsync({ id: goal.id, ...payload });
      } else {
        await createGoal.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? "Gagal menyimpan goal. Coba lagi.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="px-6 py-5"
        style={{ borderBottom: "1px solid #262626", backgroundColor: "#0e0e0e" }}
      >
        <DialogTitle
          className="text-base font-semibold"
          style={{ color: "#e5e2e1", fontFamily: "var(--font-hanken)" }}
        >
          {isEdit ? "Edit Goal" : "Add Goal"}
        </DialogTitle>
        <DialogDescription
          className="text-sm mt-1"
          style={{ color: "#bccabb", fontFamily: "var(--font-inter)" }}
        >
          {isEdit ? goal?.name : "Set a savings target"}
        </DialogDescription>
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] font-bold tracking-widest uppercase" style={labelStyle}>
            Goal Name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vacation Fund"
            required
            className="h-11"
            style={inputStyle}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold tracking-widest uppercase" style={labelStyle}>
            Target Amount
          </label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold select-none"
              style={{ color: "#3d4a3e" }}
            >
              Rp
            </span>
            <Input
              type="text"
              inputMode="numeric"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value.replace(/\D/g, ""))}
              required
              className="h-11 pl-10 pr-4"
              style={inputStyle}
            />
          </div>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold tracking-widest uppercase" style={labelStyle}>
              Saved So Far
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold select-none"
                style={{ color: "#3d4a3e" }}
              >
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value.replace(/\D/g, ""))}
                className="h-11 pl-10 pr-4"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[11px] font-bold tracking-widest uppercase" style={labelStyle}>
            Deadline (optional)
          </label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-11"
            style={inputStyle}
          />
        </div>

        {error && (
          <p className="text-[11px]" style={{ color: "#ffb4ab" }}>{error}</p>
        )}
      </div>

      <div
        className="flex justify-end gap-3 px-6 py-5"
        style={{ borderTop: "1px solid #262626", backgroundColor: "#0e0e0e" }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isPending}
          className="h-9 text-sm font-medium"
          style={{ color: "#bccabb" }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="h-9 font-semibold"
          style={{ backgroundColor: "#4ade80", color: "#131313" }}
        >
          {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Goal"}
        </Button>
      </div>
    </form>
  );
}
