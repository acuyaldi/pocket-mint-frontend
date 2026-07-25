"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClarificationOption } from "@/src/types/assistant";

interface ClarificationOptionsProps {
  options: ClarificationOption[];
  /** Token of the option currently being submitted, if any — drives the per-button spinner. */
  pendingToken: string | null;
  /** True while any option submission is in flight — disables the whole group. */
  disabled: boolean;
  onSelect: (token: string) => void;
}

/** Backend-provided clarification options only — never client-generated, never reordered. */
export function ClarificationOptions({ options, pendingToken, disabled, onSelect }: ClarificationOptionsProps) {
  return (
    <div role="group" className="flex flex-col gap-2">
      {options.map((option) => {
        const isPending = pendingToken === option.token;
        return (
          <Button
            key={option.token}
            type="button"
            variant="outline"
            onClick={() => onSelect(option.token)}
            disabled={disabled}
            aria-busy={isPending}
            className="h-11 justify-start gap-2 bg-card px-4 text-left"
          >
            {isPending ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
            <span>{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
