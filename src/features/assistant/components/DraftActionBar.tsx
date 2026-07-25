"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DraftActionBarLabels {
  confirm: string;
  confirming: string;
  cancel: string;
  cancelling: string;
}

interface DraftActionBarProps {
  labels: DraftActionBarLabels;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
  isCancelling: boolean;
  /** True once the draft is no longer actionable (already committed/cancelled/expired). */
  disabled?: boolean;
}

/** Confirm/Cancel controls for a Pending Financial Draft. Generic enough to be reused by a future clarification screen's accept/reject actions. */
export function DraftActionBar({ labels, onConfirm, onCancel, isConfirming, isCancelling, disabled }: DraftActionBarProps) {
  const isBusy = isConfirming || isCancelling;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={disabled || isBusy}
        className="h-11 flex-1 gap-2 bg-card"
      >
        {isCancelling ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {isCancelling ? labels.cancelling : labels.cancel}
      </Button>
      <Button type="button" onClick={onConfirm} disabled={disabled || isBusy} className="h-11 flex-1 gap-2">
        {isConfirming ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {isConfirming ? labels.confirming : labels.confirm}
      </Button>
    </div>
  );
}
