"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Archive, Loader2, Plus, Trash2 } from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { AssistantConversationHistoryList } from "@/src/features/assistant/components/AssistantConversationHistoryList";
import { AssistantConversationHistoryTrigger } from "@/src/features/assistant/components/AssistantConversationHistoryTrigger";
import {
  useArchiveAssistantSession,
  useAssistantConversationHistory,
  useDeleteAssistantSession,
  useRestoreAssistantSession,
} from "@/src/features/assistant/hooks/useAssistantSession";
import type { AssistantConversationSummary } from "@/src/types/assistant";

interface AssistantConversationHistoryProps {
  conversationId: string | null;
  canStartNewConversation: boolean;
  onSwitchConversation: (id: string, options?: { force?: boolean }) => boolean;
  onStartNewConversation: (options?: { force?: boolean }) => void;
  intlLocale: string;
}

/**
 * Trigger + dialog for discovering and reopening previous Assistant
 * conversations. Orchestration only — list rendering lives in
 * `AssistantConversationHistoryList`. Never claims backend cancellation:
 * "continuing" past a blocked switch only discards local transient UI
 * state, exactly like `startNewConversation` already does.
 */
export function AssistantConversationHistory({
  conversationId,
  canStartNewConversation,
  onSwitchConversation,
  onStartNewConversation,
  intlLocale,
}: AssistantConversationHistoryProps) {
  const t = useTranslations("assistant.history");
  const [isOpen, setIsOpen] = useState(false);
  const [blockedTargetId, setBlockedTargetId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [archiveConfirmation, setArchiveConfirmation] = useState<AssistantConversationSummary[] | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<AssistantConversationSummary[] | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const query = useAssistantConversationHistory();
  const archiveMutation = useArchiveAssistantSession();
  const deleteMutation = useDeleteAssistantSession();
  const restoreMutation = useRestoreAssistantSession();
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data?.pages]);
  const totalCount = query.data?.pages[0]?.total ?? 0;

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.status === "ACTIVE") ||
        (statusFilter === "archived" && item.status === "ARCHIVED");
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;
      return (
        (item.title?.toLocaleLowerCase().includes(normalizedSearch) ?? false) ||
        (item.lastMessage?.toLocaleLowerCase().includes(normalizedSearch) ?? false)
      );
    });
  }, [items, searchText, statusFilter]);

  const emptyMessage = useMemo(() => {
    if (searchText.trim()) return t("noSearchResults");
    if (statusFilter === "active") return t("emptyActive");
    if (statusFilter === "archived") return t("emptyArchived");
    return t("emptyAll");
  }, [searchText, statusFilter, t]);

  const selectedItems = useMemo(() => items.filter((item) => selectedIds.has(item.id)), [items, selectedIds]);
  const selectedActiveItems = useMemo(() => selectedItems.filter((item) => item.status === "ACTIVE"), [selectedItems]);
  const selectedCount = selectedItems.length;

  const labels = {
    listLabel: t("listLabel"),
    loading: t("loading"),
    error: t("error"),
    retry: t("retry"),
    emptyAll: t("emptyAll"),
    emptyActive: t("emptyActive"),
    emptyArchived: t("emptyArchived"),
    loadMore: t("loadMore"),
    loadingMore: t("loadingMore"),
    activeConversationLabel: t("activeConversationLabel"),
    statusActive: t("statusActive"),
    archivedStatus: t("archivedStatus"),
    searchLoaded: t("searchLoaded"),
    searchPlaceholder: t("searchPlaceholder"),
    filterAll: t("filterAll"),
    filterActive: t("filterActive"),
    filterArchived: t("filterArchived"),
    showingLoaded: t("showingLoaded", { loaded: items.length, total: totalCount }),
    noSearchResults: t("noSearchResults"),
    selectConversation: t("selectConversation"),
    selectAllLoaded: t("selectAllLoaded"),
    clearSelection: t("clearSelection"),
    archive: t("archive"),
    archiving: t("archiving"),
    restore: t("restore"),
    restoring: t("restoring"),
    delete: t("delete"),
    actionsFor: (label: string) => t("actionsFor", { label }),
    conversationFromDate: (date: string) => t("conversationFromDate", { date }),
  };

  function handleClose() {
    setIsOpen(false);
    setBlockedTargetId(null);
    setArchiveConfirmation(null);
    setDeleteConfirmation(null);
    setSelectedIds(new Set());
  }

  function handleSelect(id: string) {
    if (onSwitchConversation(id)) {
      handleClose();
      return;
    }
    setBlockedTargetId(id);
  }

  function handleConfirmSwitch() {
    if (!blockedTargetId) return;
    onSwitchConversation(blockedTargetId, { force: true });
    handleClose();
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllLoaded() {
    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function confirmArchive() {
    if (!archiveConfirmation?.length) return;
    const ids = archiveConfirmation.map((item) => item.id);
    try {
      await Promise.all(ids.map((id) => archiveMutation.mutateAsync(id)));
      if (conversationId && ids.includes(conversationId)) onStartNewConversation();
      setArchiveConfirmation(null);
      setSelectedIds(new Set());
      toast(t("archiveSuccess", { count: ids.length }), "success");
    } catch {
      toast(t("archiveError"), "error");
    }
  }

  async function confirmDelete() {
    if (!deleteConfirmation?.length) return;
    const ids = deleteConfirmation.map((item) => item.id);
    try {
      await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
      // Deletion is permanent — force the reset even if an unresolved draft/clarification
      // on this conversation would otherwise block `startNewConversation` (the conversation
      // it belongs to no longer exists server-side).
      if (conversationId && ids.includes(conversationId)) onStartNewConversation({ force: true });
      setDeleteConfirmation(null);
      setSelectedIds(new Set());
      toast(t("deleteSuccess", { count: ids.length }), "success");
    } catch {
      toast(t("deleteError"), "error");
    }
  }

  async function handleRestore(item: AssistantConversationSummary) {
    setRestoringId(item.id);
    try {
      await restoreMutation.mutateAsync(item.id);
      toast(t("restoreSuccess"), "success");
    } catch {
      toast(t("restoreError"), "error");
    } finally {
      setRestoringId(null);
    }
  }

  const archiveDescription = archiveConfirmation
    ? t("archiveDescription", {
        count: archiveConfirmation.length,
        active: conversationId && archiveConfirmation.some((item) => item.id === conversationId) ? t("archiveActiveWarning") : "",
      })
    : undefined;

  const isAlertDialog = Boolean(archiveConfirmation || deleteConfirmation);
  const isModalPending = archiveMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <AssistantConversationHistoryTrigger label={t("openLabel")} onClick={() => setIsOpen(true)} />
      <AppModal
        open={isOpen}
        onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}
        size="lg"
        className="sm:max-w-3xl"
        role={isAlertDialog ? "alertdialog" : "dialog"}
        isPending={isModalPending}
        title={
          archiveConfirmation
            ? t("archiveTitle", { count: archiveConfirmation.length })
            : deleteConfirmation
              ? t("deleteTitle", { count: deleteConfirmation.length })
              : blockedTargetId
                ? t("switchBlockedTitle")
                : t("title")
        }
        description={
          archiveConfirmation
            ? archiveDescription
            : deleteConfirmation
              ? t("deleteDescription", { count: deleteConfirmation.length })
              : blockedTargetId
                ? t("switchBlockedDescription")
                : undefined
        }
        footer={
          archiveConfirmation ? (
            <>
              <ModalCancelButton isPending={archiveMutation.isPending} onClick={() => setArchiveConfirmation(null)}>
                {t("archiveCancel")}
              </ModalCancelButton>
              <ModalSubmitButton
                type="button"
                variant="destructive"
                isPending={archiveMutation.isPending}
                pendingLabel={t("archiving")}
                onClick={confirmArchive}
              >
                {t("archiveConfirm")}
              </ModalSubmitButton>
            </>
          ) : deleteConfirmation ? (
            <>
              <ModalCancelButton isPending={deleteMutation.isPending} onClick={() => setDeleteConfirmation(null)}>
                {t("deleteCancel")}
              </ModalCancelButton>
              <ModalSubmitButton
                type="button"
                variant="destructive"
                isPending={deleteMutation.isPending}
                pendingLabel={t("deleting")}
                onClick={confirmDelete}
              >
                <Trash2 data-icon="inline-start" aria-hidden="true" />
                {t("deleteConfirm", { count: deleteConfirmation.length })}
              </ModalSubmitButton>
            </>
          ) : blockedTargetId ? (
            <>
              <ModalCancelButton onClick={() => setBlockedTargetId(null)}>{t("switchCancel")}</ModalCancelButton>
              <ModalSubmitButton type="button" onClick={handleConfirmSwitch}>
                {t("switchConfirm")}
              </ModalSubmitButton>
            </>
          ) : (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">{t("permanentDeleteNote")}</p>
              <Button
                type="button"
                variant="outline"
                size="touch"
                disabled={!canStartNewConversation}
                onClick={() => {
                  onStartNewConversation();
                  handleClose();
                }}
                className="bg-card"
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                {t("newConversation")}
              </Button>
            </div>
          )
        }
      >
        {blockedTargetId || archiveConfirmation || deleteConfirmation ? null : (
          <div className="flex min-h-[28rem] flex-col gap-4">
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                {labels.searchLoaded}
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={labels.searchPlaceholder}
                  className="h-11 bg-card"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2" aria-label={t("filterLabel")}>
                  {([
                    ["all", labels.filterAll],
                    ["active", labels.filterActive],
                    ["archived", labels.filterArchived],
                  ] as const).map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      variant={statusFilter === value ? "secondary" : "outline"}
                      size="sm"
                      aria-pressed={statusFilter === value}
                      onClick={() => setStatusFilter(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{labels.showingLoaded}</p>
              </div>
            </div>

            {selectedCount > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-low p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-foreground">{t("selectedCount", { count: selectedCount })}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                    {labels.clearSelection}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setArchiveConfirmation(selectedActiveItems)}
                    disabled={archiveMutation.isPending || selectedActiveItems.length === 0}
                  >
                    {archiveMutation.isPending ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" /> : <Archive data-icon="inline-start" aria-hidden="true" />}
                    {labels.archive}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteConfirmation(selectedItems)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" /> : <Trash2 data-icon="inline-start" aria-hidden="true" />}
                    {labels.delete}
                  </Button>
                </div>
              </div>
            ) : null}

            <AssistantConversationHistoryList
              items={filteredItems}
              loadedCount={items.length}
              filteredCount={filteredItems.length}
              isLoading={query.isLoading}
              isError={query.isError}
              onRetry={() => query.refetch()}
              emptyMessage={emptyMessage}
              selectedId={conversationId}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onToggleSelect={toggleSelected}
              onSelectAllLoaded={selectAllLoaded}
              onClearSelection={clearSelection}
              onArchive={(item) => setArchiveConfirmation([item])}
              onRestore={handleRestore}
              restoringId={restoringId}
              onDeleteRequest={(item) => setDeleteConfirmation([item])}
              hasMore={!!query.hasNextPage}
              isLoadingMore={query.isFetchingNextPage}
              onLoadMore={() => query.fetchNextPage()}
              intlLocale={intlLocale}
              labels={labels}
            />
          </div>
        )}
      </AppModal>
    </>
  );
}
