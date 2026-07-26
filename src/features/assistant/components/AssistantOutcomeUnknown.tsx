"use client";

import type { RefObject } from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AssistantOutcomeUnknownLabels {
  heading: string;
  description: string;
  check: string;
  checking: string;
  retry: string;
  retrying: string;
}

interface AssistantOutcomeUnknownProps {
  onCheck: () => void;
  /** Omit entirely when the failed action isn't contractually safe to retry (e.g. a plain message send). */
  onRetry?: () => void;
  isChecking: boolean;
  isRetrying: boolean;
  labels: AssistantOutcomeUnknownLabels;
  headingRef?: RefObject<HTMLElement | null>;
}

/**
 * Shown after a mutation fails ambiguously (no HTTP response ever reached
 * the client) — the previous action's outcome is genuinely unknown, not a
 * failure and not a success. `role="status"`, not `role="alert"`: this isn't
 * definitively an error.
 */
export function AssistantOutcomeUnknown({
  onCheck,
  onRetry,
  isChecking,
  isRetrying,
  labels,
  headingRef,
}: AssistantOutcomeUnknownProps) {
  const busy = isChecking || isRetrying;

  return (
    <div role="status" className="max-w-xl rounded-xl border border-amber/30 bg-amber/10 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <HelpCircle className="size-5 text-amber-strong" aria-hidden="true" />
        <h2
          ref={headingRef as RefObject<HTMLHeadingElement> | undefined}
          tabIndex={-1}
          className="text-sm font-semibold text-foreground outline-none"
        >
          {labels.heading}
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{labels.description}</p>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCheck} disabled={busy} className="h-11 flex-1 gap-2 bg-card">
          {isChecking ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isChecking ? labels.checking : labels.check}
        </Button>
        {onRetry ? (
          <Button type="button" onClick={onRetry} disabled={busy} className="h-11 flex-1 gap-2">
            {isRetrying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {isRetrying ? labels.retrying : labels.retry}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
