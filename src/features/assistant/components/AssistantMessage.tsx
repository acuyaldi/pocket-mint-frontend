import { Loader2, Send, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssistantChannel, AssistantDeliveryStatus, AssistantMessage as AssistantMessageDto } from "@/src/types/assistant";

export interface AssistantMessageLabels {
  USER: string;
  ASSISTANT: string;
  SYSTEM: string;
  /** Phase 30 — shown next to the role label only when `channel` is `"TELEGRAM"`. */
  telegramChannel?: string;
  /** Phase 31 — delivery-state copy for a Telegram-originated Assistant reply. */
  deliveryDelivering?: string;
  deliverySent?: string;
  deliveryFailed?: string;
}

interface AssistantMessageProps {
  message: Pick<AssistantMessageDto, "role" | "content">;
  labels: AssistantMessageLabels;
  /** The turn's channel (Phase 30), when known — absent or `"WEB"` renders nothing extra, keeping the default case visually unchanged. */
  channel?: AssistantChannel;
  /** The turn's channel delivery status (Phase 31) — only ever shown for an ASSISTANT-role message on a TELEGRAM turn. */
  deliveryStatus?: AssistantDeliveryStatus;
}

/** `PENDING`/`PROCESSING` both read as still-in-progress; `NOT_APPLICABLE`, `UNKNOWN` (Phase 32 — retention-purged history, never shown as failure), and an absent status all fall through to `default` and render nothing. */
function deliveryStateOf(
  deliveryStatus: AssistantDeliveryStatus | undefined,
  labels: AssistantMessageLabels,
): { label: string; icon: typeof Send } | null {
  switch (deliveryStatus) {
    case "PENDING":
    case "PROCESSING":
      return labels.deliveryDelivering ? { label: labels.deliveryDelivering, icon: Loader2 } : null;
    case "DELIVERED":
      return labels.deliverySent ? { label: labels.deliverySent, icon: Send } : null;
    case "FAILED":
      return labels.deliveryFailed ? { label: labels.deliveryFailed, icon: TriangleAlert } : null;
    default:
      return null;
  }
}

/**
 * Renders one persisted or pending Assistant message. User and assistant
 * content are distinguished by alignment, a text label, and typography
 * weight — never by color alone. Plain text only: backend content is never
 * markdown or HTML, so it is rendered as-is with line breaks preserved via
 * `whitespace-pre-line` — never raw HTML injection.
 */
export function AssistantMessage({ message, labels, channel, deliveryStatus }: AssistantMessageProps) {
  const isUser = message.role === "USER";
  // Delivery state is about the outbound reply reaching Telegram — only ever shown on the ASSISTANT side, never on the user's own echoed message.
  const delivery = message.role === "ASSISTANT" && channel === "TELEGRAM" ? deliveryStateOf(deliveryStatus, labels) : null;

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
        {delivery ? (
          <span title={delivery.label} className="normal-case">
            <delivery.icon className={cn("size-3", delivery.icon === Loader2 && "animate-spin")} aria-hidden="true" />
            <span className="sr-only">{delivery.label}</span>
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
