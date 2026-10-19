"use client";

import type { RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantRecoveryClarification } from "@/src/types/assistant";
import type { AssistantNotActionableReason, AssistantTerminalCondition } from "@/src/features/assistant/utils/errors";
import { TransferWalletContext, type TransferWalletLabels } from "./ClarificationCard";

export interface AssistantTerminalLabels {
  title: Record<AssistantTerminalCondition["kind"], string>;
  /** One explanation per condition; `notActionable` is explained by its reason. */
  description: Record<Exclude<AssistantTerminalCondition["kind"], "notActionable"> | AssistantNotActionableReason, string>;
  resend: string;
  resending: string;
  /** Shown instead of the resend button when the original instruction isn't on the loaded page. */
  resendUnavailable: string;
}

export interface AssistantRecoveryBannerLabels {
  recoveryLoading: string;
  transientLostTitle: string;
  clarificationRecoveredTitle: string;
  turnRunning: string;
  cancel: string;
  cancelling: string;
  terminal: AssistantTerminalLabels;
  transfer: TransferWalletLabels;
}

type AssistantRecoveryBannerProps =
  | {
      kind: "recoveryLoading";
      labels: AssistantRecoveryBannerLabels;
    }
  | {
      kind: "transientClarificationLost";
      labels: AssistantRecoveryBannerLabels;
    }
  | {
      kind: "turnRunning";
      labels: AssistantRecoveryBannerLabels;
    }
  | {
      kind: "terminal";
      condition: AssistantTerminalCondition;
      /** Expired/failed only — sends the original instruction again as a new draft. Absent when it can't be found. */
      onResend?: () => void;
      isResending?: boolean;
      labels: AssistantRecoveryBannerLabels;
      headingRef?: RefObject<HTMLElement | null>;
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
  if (props.kind === "recoveryLoading") {
    return (
      <p
        role="status"
        className="flex min-h-16 items-center gap-2 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-foreground"
      >
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        {props.labels.recoveryLoading}
      </p>
    );
  }

  if (props.kind === "transientClarificationLost") {
    return (
      <p role="status" className="min-h-16 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-foreground">
        {props.labels.transientLostTitle}
      </p>
    );
  }

  if (props.kind === "turnRunning") {
    return (
      <p
        role="status"
        className="flex min-h-16 items-center gap-2 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-foreground"
      >
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        {props.labels.turnRunning}
      </p>
    );
  }

  if (props.kind === "terminal") {
    const { condition, onResend, isResending, labels, headingRef } = props;
    const descriptionKey = condition.kind === "notActionable" ? condition.reason : condition.kind;
    // Terminal states never offer Confirm: expired/failed offer a fresh draft, the rest are information only.
    const offersResend = condition.kind === "expired" || condition.kind === "failed";
    return (
      <div role="status" className="max-w-xl rounded-xl border border-amber/30 bg-amber/10 p-6 shadow-sm">
        <h2
          ref={headingRef as RefObject<HTMLHeadingElement> | undefined}
          tabIndex={-1}
          className="text-base font-semibold text-foreground outline-none"
        >
          {labels.terminal.title[condition.kind]}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{labels.terminal.description[descriptionKey]}</p>
        {offersResend ? (
          onResend ? (
            <Button type="button" onClick={onResend} disabled={isResending} className="mt-4 h-11 gap-2 px-4">
              {isResending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {isResending ? labels.terminal.resending : labels.terminal.resend}
            </Button>
          ) : (
            <p className="mt-4 text-sm text-foreground">{labels.terminal.resendUnavailable}</p>
          )
        ) : null}
      </div>
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
      {clarification.transfer ? (
        <TransferWalletContext transfer={clarification.transfer} labels={labels.transfer} />
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{clarification.prompt}</p>
      )}
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
