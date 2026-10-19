"use client";

import { useId, type RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClarificationOptions } from "./ClarificationOptions";
import type {
  AssistantClarificationEntityType,
  AssistantTransferWalletClarification,
  ClarificationRequest,
} from "@/src/types/assistant";

export interface TransferWalletLabels {
  /** "Dari wallet mana?" / "Ke wallet mana?" */
  question: Record<AssistantTransferWalletClarification["field"], string>;
  description: Record<AssistantTransferWalletClarification["field"], string>;
  /** Prefix of the already-chosen source, e.g. "Dari". */
  from: string;
}

export interface ClarificationCardLabels {
  cancel: string;
  cancelling: string;
  titleByEntity: Record<AssistantClarificationEntityType, string>;
  descriptionByEntity: Record<AssistantClarificationEntityType, string>;
  transfer: TransferWalletLabels;
}

/**
 * Phase 38 — names which TRANSFER wallet slot is being asked, and shows the
 * already-chosen source before the destination question. Reads only the
 * structured `transfer` field, never the prompt text.
 */
export function TransferWalletContext({
  transfer,
  labels,
}: {
  transfer: AssistantTransferWalletClarification;
  labels: TransferWalletLabels;
}) {
  return (
    <div className="mt-2 space-y-2">
      <SelectedSourceWallet transfer={transfer} labels={labels} />
      <p className="text-sm font-medium text-foreground">{labels.question[transfer.field]}</p>
      <p className="text-sm text-muted-foreground">{labels.description[transfer.field]}</p>
    </div>
  );
}

function SelectedSourceWallet({ transfer, labels, id }: { transfer: AssistantTransferWalletClarification; labels: TransferWalletLabels; id?: string }) {
  if (!transfer.sourceWalletLabel) return null;
  return (
    <p id={id} className="w-fit rounded-lg border border-border/70 bg-muted/40 px-3 py-1.5 text-sm text-foreground">
      <span className="text-muted-foreground">{labels.from}:</span>{" "}
      <span className="font-medium">{transfer.sourceWalletLabel}</span>
    </p>
  );
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
  const { transfer } = clarification;
  const title = transfer ? labels.transfer.question[transfer.field] : labels.titleByEntity[clarification.entityType];
  // Focus lands on the heading, so the already-chosen source is announced with it.
  const sourceId = useId();

  return (
    <article className="max-w-xl rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      {transfer?.sourceWalletLabel ? (
        <div className="mb-3">
          <SelectedSourceWallet transfer={transfer} labels={labels.transfer} id={sourceId} />
        </div>
      ) : null}
      <h2
        ref={headingRef as RefObject<HTMLHeadingElement> | undefined}
        tabIndex={-1}
        aria-describedby={transfer?.sourceWalletLabel ? sourceId : undefined}
        className="text-base font-semibold text-foreground outline-none"
      >
        {title}
      </h2>
      {transfer ? (
        <p className="mt-1 text-sm text-muted-foreground">{labels.transfer.description[transfer.field]}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">{labels.descriptionByEntity[clarification.entityType]}</p>
          <p className="mt-4 text-sm text-foreground">{clarification.prompt}</p>
        </>
      )}

      <div className="mt-4">
        <ClarificationOptions
          entityType={clarification.entityType}
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
