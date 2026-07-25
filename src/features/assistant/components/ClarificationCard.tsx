"use client";

import type { RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClarificationOptions } from "./ClarificationOptions";
import type { ClarificationRequest } from "@/src/types/assistant";

export interface ClarificationCardLabels {
  cancel: string;
  cancelling: string;
}

interface ClarificationCardProps {
  clarification: ClarificationRequest;
  pendingToken: string | null;
  isSelecting: boolean;
  isCancelling: boolean;
  onSelect: (token: string) => void;
  onCancel: () => void;
  labels: ClarificationCardLabels;
  headingRef?: RefObject<HTMLElement | null>;
}

/** Renders a backend clarification request — prompt plus the exact options the backend returned, in the order given. */
export function ClarificationCard({
  clarification,
  pendingToken,
  isSelecting,
  isCancelling,
  onSelect,
  onCancel,
  labels,
  headingRef,
}: ClarificationCardProps) {
  return (
    <article className="max-w-xl rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <h2
        ref={headingRef as RefObject<HTMLHeadingElement> | undefined}
        tabIndex={-1}
        className="text-base font-semibold text-foreground outline-none"
      >
        {clarification.prompt}
      </h2>

      <div className="mt-4">
        <ClarificationOptions
          options={clarification.options}
          pendingToken={pendingToken}
          disabled={isSelecting || isCancelling}
          onSelect={onSelect}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isSelecting || isCancelling}
        className="mt-4 h-11 gap-2 px-4"
      >
        {isCancelling ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {isCancelling ? labels.cancelling : labels.cancel}
      </Button>
    </article>
  );
}
