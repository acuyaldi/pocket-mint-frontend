import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssistantChannel, AssistantMessage as AssistantMessageDto } from "@/src/types/assistant";

export interface AssistantMessageLabels {
  USER: string;
  ASSISTANT: string;
  SYSTEM: string;
  /** Phase 30 — shown next to the role label only when `channel` is `"TELEGRAM"`. */
  telegramChannel?: string;
}

interface AssistantMessageProps {
  message: Pick<AssistantMessageDto, "role" | "content">;
  labels: AssistantMessageLabels;
  /** The turn's channel (Phase 30), when known — absent or `"WEB"` renders nothing extra, keeping the default case visually unchanged. */
  channel?: AssistantChannel;
}

/**
 * Renders one persisted or pending Assistant message. User and assistant
 * content are distinguished by alignment, a text label, and typography
 * weight — never by color alone. Plain text only: backend content is never
 * markdown or HTML, so it is rendered as-is with line breaks preserved via
 * `whitespace-pre-line` — never raw HTML injection.
 */
export function AssistantMessage({ message, labels, channel }: AssistantMessageProps) {
  const isUser = message.role === "USER";

  return (
    <li className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {labels[message.role]}
        {channel === "TELEGRAM" && labels.telegramChannel ? (
          <span title={labels.telegramChannel} className="normal-case">
            <Send className="size-3" aria-hidden="true" />
            <span className="sr-only">{labels.telegramChannel}</span>
          </span>
        ) : null}
      </span>
      <p
        className={cn(
          "max-w-[min(42rem,85%)] whitespace-pre-line rounded-xl px-4 py-2.5 text-sm",
          isUser ? "bg-slate text-primary-foreground" : "border border-border/70 bg-card text-foreground"
        )}
      >
        {message.content}
      </p>
    </li>
  );
}
