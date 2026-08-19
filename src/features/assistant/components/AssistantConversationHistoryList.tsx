"use client";

import { Archive, ArchiveRestore, Loader2, MessageSquare, MoreVertical, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AssistantConversationSummary } from "@/src/types/assistant";

export interface AssistantConversationHistoryLabels {
  listLabel: string;
  loading: string;
  error: string;
  retry: string;
  emptyAll: string;
  emptyActive: string;
  emptyArchived: string;
  loadMore: string;
  loadingMore: string;
  activeConversationLabel: string;
  statusActive: string;
  archivedStatus: string;
  searchLoaded: string;
  searchPlaceholder: string;
  filterAll: string;
  filterActive: string;
  filterArchived: string;
  showingLoaded: string;
  noSearchResults: string;
  selectConversation: string;
  selectAllLoaded: string;
  clearSelection: string;
  archive: string;
  archiving: string;
  restore: string;
  restoring: string;
  delete: string;
  actionsFor: (label: string) => string;
  conversationFromDate: (date: string) => string;
}

function formatActivityDate(value: string, intlLocale: string) {
  return new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value)
  );
}

/**
 * Deterministic, non-AI label: the first user-authored message (the original
 * request that started the conversation) when persisted, falling back to the
 * latest message preview, then a date fallback. Never parsed or interpreted
 * — plain text only. Prefers `title` over `lastMessage` so the label reflects
 * original intent instead of whatever turn happened most recently (e.g. a
 * clarification confirmation).
 */
export function resolveConversationLabel(
  summary: AssistantConversationSummary,
  labels: AssistantConversationHistoryLabels,
  intlLocale: string
) {
  if (summary.title?.trim()) return summary.title;
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
  emptyMessage: string;
  selectedId: string | null;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAllLoaded: () => void;
  onClearSelection: () => void;
  onArchive: (item: AssistantConversationSummary) => void;
  onRestore: (item: AssistantConversationSummary) => void;
  restoringId?: string | null;
  onDeleteRequest: (item: AssistantConversationSummary) => void;
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
  emptyMessage,
  selectedId,
  selectedIds,
  onSelect,
  onToggleSelect,
  onSelectAllLoaded,
  onClearSelection,
  onArchive,
  onRestore,
  restoringId,
  onDeleteRequest,
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
    return <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{filteredCount} / {loadedCount}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
            {labels.clearSelection}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onSelectAllLoaded}>
            {labels.selectAllLoaded}
          </Button>
        </div>
      </div>
      <ul aria-label={labels.listLabel} className="flex min-h-0 max-h-[52vh] flex-col gap-1 overflow-y-auto pr-1">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const isChecked = selectedIds.has(item.id);
          const label = resolveConversationLabel(item, labels, intlLocale);
          const isArchived = item.status === "ARCHIVED";
          const isRestoring = restoringId === item.id;
          return (
            <li key={item.id}>
              <div
                className={cn(
                  "grid min-h-16 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:bg-muted/60",
                  isSelected && "border-border bg-muted"
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSelect(item.id)}
                  aria-label={`${labels.selectConversation}: ${label}`}
                  className="size-4 shrink-0 cursor-pointer rounded border-border accent-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
                >
                  <MessageSquare className="size-4" />
                </span>
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
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{formatActivityDate(item.lastActivityAt, intlLocale)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{isArchived ? labels.archivedStatus : labels.statusActive}</span>
                  </span>
                </button>
                {isRestoring ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          aria-label={labels.actionsFor(label)}
                          className={buttonVariants({ variant: "ghost", size: "icon-touch" })}
                        >
                          <MoreVertical aria-hidden="true" />
                        </button>
                      }
                    />
                    <DropdownMenuContent>
                      {isArchived ? (
                        <DropdownMenuItem onClick={() => onRestore(item)}>
                          <ArchiveRestore aria-hidden="true" />
                          {labels.restore}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onArchive(item)}>
                          <Archive aria-hidden="true" />
                          {labels.archive}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDeleteRequest(item)}
                        className="text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
                      >
                        <Trash2 aria-hidden="true" />
                        {labels.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
