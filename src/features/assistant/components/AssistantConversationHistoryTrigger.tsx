"use client";

import { History } from "lucide-react";

interface AssistantConversationHistoryTriggerProps {
  label: string;
  onClick: () => void;
}

/** Opens the conversation history dialog. Icon-only with a stable accessible name — no unread badge (conversation history has no unread concept). */
export function AssistantConversationHistoryTrigger({ label, onClick }: AssistantConversationHistoryTriggerProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-high hover:text-primary active:scale-95"
    >
      <History className="size-5" aria-hidden="true" />
    </button>
  );
}
