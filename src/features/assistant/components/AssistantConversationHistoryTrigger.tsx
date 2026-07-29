"use client";

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssistantConversationHistoryTriggerProps {
  label: string;
  onClick: () => void;
}

/** Opens the conversation history dialog. Icon-only with a stable accessible name — no unread badge (conversation history has no unread concept). */
export function AssistantConversationHistoryTrigger({ label, onClick }: AssistantConversationHistoryTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-touch"
      aria-label={label}
      onClick={onClick}
    >
      <History aria-hidden="true" />
    </Button>
  );
}
