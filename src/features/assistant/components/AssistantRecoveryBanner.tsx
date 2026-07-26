"use client";

import type { RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantRecoveryClarification } from "@/src/types/assistant";

export interface AssistantRecoveryBannerLabels {
  transientLostTitle: string;
  clarificationRecoveredTitle: string;
  cancel: string;
  cancelling: string;
}

type AssistantRecoveryBannerProps =
  | {
      kind: "transientClarificationLost";
      labels: AssistantRecoveryBannerLabels;
    }
  | {
      kind: "clarificationRecovered";
      clarification: AssistantRecoveryClarification;
      isCancelling: boolean;
      onCancel: () => void;
      labels: AssistantRecoveryBannerLabels;
      headingRef?: RefObject<HTMLElement | null>;
    };

/**
 * Recovery-state UI for a refresh/direct-nav where the in-memory workflow
 * was lost. Not an error — `role="status"` — the backend's real state is
 * either gone (transient, nothing to recover) or was rediscovered
 * (recovered). The recovered clarification's options are read-only: the
 * recovery-state endpoint never re-exposes a raw selection token, so only
 * Cancel is wired here, never `select`.
 */
export function AssistantRecoveryBanner(props: AssistantRecoveryBannerProps) {
  if (props.kind === "transientClarificationLost") {
    return (
      <p role="status" className="rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-foreground">
        {props.labels.transientLostTitle}
      </p>
    );
  }

  const { clarification, isCancelling, onCancel, labels, headingRef } = props;
  return (
    <div role="status" className="max-w-xl rounded-xl border border-amber/30 bg-amber/10 p-6 shadow-sm">
      <h2
        ref={headingRef as RefObject<HTMLHeadingElement> | undefined}
        tabIndex={-1}
        className="text-base font-semibold text-foreground outline-none"
      >
        {labels.clarificationRecoveredTitle}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{clarification.prompt}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {clarification.options.map((option, index) => (
          <li
            key={`${option.label}-${index}`}
            className="rounded-lg border border-border/70 bg-card px-4 py-3 text-sm text-foreground"
          >
            {option.label}
          </li>
        ))}
      </ul>
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isCancelling} className="mt-4 h-11 gap-2 px-4">
        {isCancelling ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {isCancelling ? labels.cancelling : labels.cancel}
      </Button>
    </div>
  );
}
