"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssistantClarificationEntityType, ClarificationOption } from "@/src/types/assistant";

interface ClarificationOptionsProps {
  entityType: AssistantClarificationEntityType;
  options: ClarificationOption[];
  /** Token of the option currently being submitted, if any — drives the per-button spinner. */
  pendingToken: string | null;
  /** True while any option submission is in flight — disables the whole group. */
  disabled: boolean;
  onSelect: (token: string) => void;
}

const variantByEntity: Record<AssistantClarificationEntityType, string> = {
  wallet: "grid gap-2 sm:grid-cols-2",
  category: "flex flex-wrap gap-2",
  merchant: "flex flex-wrap gap-2",
};

const buttonByEntity: Record<AssistantClarificationEntityType, string> = {
  wallet: "min-h-14 flex-col items-start justify-center gap-0.5 px-4 py-3",
  category: "min-h-11 rounded-full px-4",
  merchant: "min-h-11 rounded-full px-4",
};

/** Backend-provided clarification options only — never client-generated, never reordered. */
export function ClarificationOptions({ entityType, options, pendingToken, disabled, onSelect }: ClarificationOptionsProps) {
  return (
    <div role="group" className={variantByEntity[entityType]}>
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
            aria-pressed={isPending}
            className={cn("justify-start bg-card text-left", buttonByEntity[entityType])}
          >
            <span className="flex min-w-0 items-center gap-2">
              {isPending ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
              <span className="truncate">{option.label}</span>
            </span>
            {option.discriminator ? (
              <span className="text-xs font-normal text-muted-foreground">{option.discriminator}</span>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
