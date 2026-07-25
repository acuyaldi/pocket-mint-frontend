"use client";

import type { RefObject } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssistantResultStateProps {
  /** Server-rendered text only — never a fabricated field. */
  renderedText: string;
  actionLabel: string;
  onAction: () => void;
  headingRef?: RefObject<HTMLElement | null>;
}

/** Terminal state after a turn completes with no further action required — a confirmed draft or a plain advisory result. */
export function AssistantResultState({ renderedText, actionLabel, onAction, headingRef }: AssistantResultStateProps) {
  return (
    <article className="max-w-xl rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-5 text-mint" aria-hidden="true" />
        <h2
          ref={headingRef as RefObject<HTMLHeadingElement> | undefined}
          tabIndex={-1}
          className="text-sm font-medium text-muted-foreground outline-none"
        >
          {renderedText}
        </h2>
      </div>
      <Button type="button" onClick={onAction} className="mt-5 h-11 px-4">
        {actionLabel}
      </Button>
    </article>
  );
}
