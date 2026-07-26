"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { AssistantConversationHistoryList } from "@/src/features/assistant/components/AssistantConversationHistoryList";
import { AssistantConversationHistoryTrigger } from "@/src/features/assistant/components/AssistantConversationHistoryTrigger";
import { useAssistantConversationHistory } from "@/src/features/assistant/hooks/useAssistantSession";

interface AssistantConversationHistoryProps {
  conversationId: string | null;
  canStartNewConversation: boolean;
  onSwitchConversation: (id: string, options?: { force?: boolean }) => boolean;
  onStartNewConversation: () => void;
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

  const query = useAssistantConversationHistory();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  const labels = {
    listLabel: t("listLabel"),
    loading: t("loading"),
    error: t("error"),
    retry: t("retry"),
    empty: t("empty"),
    loadMore: t("loadMore"),
    loadingMore: t("loadingMore"),
    activeConversationLabel: t("activeConversationLabel"),
    conversationFromDate: (date: string) => t("conversationFromDate", { date }),
  };

  function handleClose() {
    setIsOpen(false);
    setBlockedTargetId(null);
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

  return (
    <>
      <AssistantConversationHistoryTrigger label={t("openLabel")} onClick={() => setIsOpen(true)} />
      <AppModal
        open={isOpen}
        onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}
        size="sm"
        title={blockedTargetId ? t("switchBlockedTitle") : t("title")}
        description={blockedTargetId ? t("switchBlockedDescription") : undefined}
        footer={
          blockedTargetId ? (
            <>
              <ModalCancelButton onClick={() => setBlockedTargetId(null)}>{t("switchCancel")}</ModalCancelButton>
              <ModalSubmitButton type="button" onClick={handleConfirmSwitch}>
                {t("switchConfirm")}
              </ModalSubmitButton>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={!canStartNewConversation}
              onClick={() => {
                onStartNewConversation();
                handleClose();
              }}
              className="h-11 w-full gap-1.5 bg-card"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("newConversation")}
            </Button>
          )
        }
      >
        {blockedTargetId ? null : (
          <AssistantConversationHistoryList
            items={items}
            isLoading={query.isLoading}
            isError={query.isError}
            onRetry={() => query.refetch()}
            selectedId={conversationId}
            onSelect={handleSelect}
            hasMore={!!query.hasNextPage}
            isLoadingMore={query.isFetchingNextPage}
            onLoadMore={() => query.fetchNextPage()}
            intlLocale={intlLocale}
            labels={labels}
          />
        )}
      </AppModal>
    </>
  );
}
