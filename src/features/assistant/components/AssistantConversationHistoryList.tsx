"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssistantConversationSummary } from "@/src/types/assistant";

export interface AssistantConversationHistoryLabels {
  listLabel: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  loadMore: string;
  loadingMore: string;
  activeConversationLabel: string;
  conversationFromDate: (date: string) => string;
}

function formatActivityDate(value: string, intlLocale: string) {
  return new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value)
  );
}

/** Deterministic, non-AI label: sanitized last-message preview when persisted, else a date fallback. Never parsed or interpreted — plain text only. */
export function resolveConversationLabel(
  summary: AssistantConversationSummary,
  labels: AssistantConversationHistoryLabels,
  intlLocale: string
) {
  if (summary.lastMessage?.trim()) return summary.lastMessage;
  return labels.conversationFromDate(formatActivityDate(summary.lastActivityAt, intlLocale));
}

interface AssistantConversationHistoryListProps {
  items: AssistantConversationSummary[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  intlLocale: string;
  labels: AssistantConversationHistoryLabels;
}

export function AssistantConversationHistoryList({
  items,
  isLoading,
  isError,
  onRetry,
  selectedId,
  onSelect,
  hasMore,
  isLoadingMore,
  onLoadMore,
  intlLocale,
  labels,
}: AssistantConversationHistoryListProps) {
  if (isLoading) {
    return (
      <p role="status" className="px-3 py-6 text-center text-sm text-muted-foreground">
        {labels.loading}
      </p>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">{labels.error}</p>
        <button type="button" onClick={onRetry} className="text-sm font-medium text-primary hover:underline">
          {labels.retry}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">{labels.empty}</p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <ul aria-label={labels.listLabel} className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const label = resolveConversationLabel(item, labels, intlLocale);
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={isSelected ? "true" : undefined}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-muted/70 focus-visible:bg-muted/70",
                  isSelected && "bg-muted font-medium"
                )}
              >
                <span className="line-clamp-1 w-full text-foreground">
                  {label}
                  {isSelected ? <span className="sr-only"> ({labels.activeConversationLabel})</span> : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatActivityDate(item.lastActivityAt, intlLocale)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          aria-busy={isLoadingMore}
          className="mt-1 gap-1.5 self-center bg-card"
        >
          {isLoadingMore ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          {isLoadingMore ? labels.loadingMore : labels.loadMore}
        </Button>
      ) : null}
    </div>
  );
}
