"use client";

import { Archive, Loader2 } from "lucide-react";
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
  archivedStatus: string;
  searchLoaded: string;
  searchPlaceholder: string;
  filterAll: string;
  filterActive: string;
  filterArchived: string;
  showingLoaded: string;
  noSearchResults: string;
  archive: string;
  archiving: string;
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
  loadedCount: number;
  filteredCount: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onArchive: (item: AssistantConversationSummary) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  intlLocale: string;
  labels: AssistantConversationHistoryLabels;
}

export function AssistantConversationHistoryList({
  items,
  loadedCount,
  filteredCount,
  isLoading,
  isError,
  onRetry,
  selectedId,
  onSelect,
  onArchive,
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
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        {loadedCount > 0 ? labels.noSearchResults : labels.empty}
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{filteredCount} / {loadedCount}</p>
        <p className="text-xs text-muted-foreground">{labels.showingLoaded}</p>
      </div>
      <ul aria-label={labels.listLabel} className="flex min-h-0 max-h-[52vh] flex-col gap-1 overflow-y-auto pr-1">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const label = resolveConversationLabel(item, labels, intlLocale);
          const isArchived = item.status === "ARCHIVED";
          return (
            <li key={item.id}>
              <div
                className={cn(
                  "grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:bg-muted/60",
                  isSelected && "border-border bg-muted"
                )}
              >
                <button
                  type="button"
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => onSelect(item.id)}
                  className="min-w-0 text-left text-sm outline-none focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="line-clamp-1 block w-full font-medium text-foreground">
                    {label}
                    {isSelected ? <span className="sr-only"> ({labels.activeConversationLabel})</span> : null}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatActivityDate(item.lastActivityAt, intlLocale)}</span>
                    {isArchived ? <span className="rounded-full border border-border bg-card px-2 py-0.5">{labels.archivedStatus}</span> : null}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-touch"
                  aria-label={`${labels.archive}: ${label}`}
                  onClick={() => onArchive(item)}
                  disabled={isArchived}
                >
                  <Archive aria-hidden="true" />
                </Button>
              </div>
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
          {isLoadingMore ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" /> : null}
          {isLoadingMore ? labels.loadingMore : labels.loadMore}
        </Button>
      ) : null}
    </div>
  );
}
