import { Loader2, TriangleAlert } from "lucide-react";
import { AssistantMessage, type AssistantMessageLabels } from "./AssistantMessage";
import type { AssistantMessage as AssistantMessageDto } from "@/src/types/assistant";

interface AssistantMessageListProps {
  /** Persisted messages only, backend order preserved (ascending `createdAt`). */
  messages: AssistantMessageDto[];
  isLoading: boolean;
  errorMessage: string | null;
  loadingLabel: string;
  errorRetryLabel: string;
  onRetry: () => void;
  messageLabels: AssistantMessageLabels;
  /** aria-label for the semantic message list region. */
  listLabel: string;
}

/**
 * Persisted conversation history. Only real `USER`/`ASSISTANT` backend
 * messages are rendered here — transient clarification/draft/pending items
 * are composed alongside this by `AssistantConversation`, never merged into
 * this list as fake messages.
 */
export function AssistantMessageList({
  messages,
  isLoading,
  errorMessage,
  loadingLabel,
  errorRetryLabel,
  onRetry,
  messageLabels,
  listLabel,
}: AssistantMessageListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {loadingLabel}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm text-coral-strong">
        <span className="flex items-center gap-2">
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </span>
        <button type="button" onClick={onRetry} className="self-start text-xs font-semibold underline underline-offset-2">
          {errorRetryLabel}
        </button>
      </div>
    );
  }

  if (messages.length === 0) return null;

  return (
    <ul aria-label={listLabel} className="flex flex-col gap-4">
      {messages.map((message) => (
        <AssistantMessage key={message.id} message={message} labels={messageLabels} />
      ))}
    </ul>
  );
}
