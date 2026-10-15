"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useTelegramConnection,
  useCreateTelegramLinkToken,
  useRevokeTelegramConnection,
} from "@/src/features/telegram/hooks/useTelegramConnection";
import { TelegramConnectionCardView, type TelegramConnectionCardLabels } from "./TelegramConnectionCardView";

export function TelegramConnectionCard() {
  const t = useTranslations("profile.telegram");
  const tCommon = useTranslations("common");
  const { data: connection, isLoading } = useTelegramConnection();
  const createLinkToken = useCreateTelegramLinkToken();
  const revoke = useRevokeTelegramConnection();

  // Held only in component state — never localStorage, never the URL. Cleared
  // on success, expiry, revocation, or navigation away (state simply unmounts).
  const [pendingToken, setPendingToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  useEffect(() => {
    if (!pendingToken) return;
    const msUntilExpiry = new Date(pendingToken.expiresAt).getTime() - Date.now();
    const timer = setTimeout(() => setPendingToken(null), Math.max(msUntilExpiry, 0));
    return () => clearTimeout(timer);
  }, [pendingToken]);

  const labels: TelegramConnectionCardLabels = {
    title: t("title"),
    subtitle: t("subtitle"),
    loading: t("loading"),
    statusLinked: t("statusLinked"),
    statusNotLinked: t("statusNotLinked"),
    generate: t("generate"),
    generating: t("generating"),
    instructions: t("instructions"),
    copy: t("copy"),
    expiresAt: (time) => t("expiresAt", { time }),
    disconnect: t("disconnect"),
    disconnectConfirmTitle: t("disconnectConfirm.title"),
    disconnectConfirmDescription: t("disconnectConfirm.description"),
    generateFailed: t("errors.generateFailed"),
    cancel: tCommon("actions.cancel"),
    deleting: tCommon("actions.deleting"),
  };

  return (
    <TelegramConnectionCardView
      status={isLoading ? "loading" : connection?.status === "ACTIVE" ? "linked" : "unlinked"}
      pendingToken={pendingToken}
      copied={copied}
      isGenerating={createLinkToken.isPending}
      generateFailed={createLinkToken.isError}
      confirmingDisconnect={confirmingDisconnect}
      isRevoking={revoke.isPending}
      labels={labels}
      onGenerate={async () => {
        setCopied(false);
        const result = await createLinkToken.mutateAsync();
        setPendingToken(result);
      }}
      onCopy={async () => {
        if (!pendingToken) return;
        await navigator.clipboard.writeText(`/link ${pendingToken.token}`);
        setCopied(true);
      }}
      onDisconnectRequest={() => setConfirmingDisconnect(true)}
      onDisconnectConfirm={async () => {
        await revoke.mutateAsync();
        setConfirmingDisconnect(false);
        setPendingToken(null);
      }}
      onDisconnectCancel={() => setConfirmingDisconnect(false)}
    />
  );
}
