"use client";

import { Send, Copy, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";

export interface TelegramConnectionCardLabels {
  title: string;
  subtitle: string;
  loading: string;
  statusLinked: string;
  statusNotLinked: string;
  generate: string;
  generating: string;
  instructions: string;
  copy: string;
  expiresAt: (time: string) => string;
  disconnect: string;
  disconnectConfirmTitle: string;
  disconnectConfirmDescription: string;
  generateFailed: string;
  cancel: string;
  deleting: string;
}

interface TelegramConnectionCardViewProps {
  status: "loading" | "linked" | "unlinked";
  pendingToken: { token: string; expiresAt: string } | null;
  copied: boolean;
  isGenerating: boolean;
  generateFailed: boolean;
  confirmingDisconnect: boolean;
  isRevoking: boolean;
  labels: TelegramConnectionCardLabels;
  onGenerate: () => void;
  onCopy: () => void;
  onDisconnectRequest: () => void;
  onDisconnectConfirm: () => void;
  onDisconnectCancel: () => void;
}

export function TelegramConnectionCardView({
  status,
  pendingToken,
  copied,
  isGenerating,
  generateFailed,
  confirmingDisconnect,
  isRevoking,
  labels,
  onGenerate,
  onCopy,
  onDisconnectRequest,
  onDisconnectConfirm,
  onDisconnectCancel,
}: TelegramConnectionCardViewProps) {
  return (
    <Card className="surface-card mb-6 max-w-2xl border border-white/80 py-0 shadow-none">
      <CardHeader className="border-b border-border px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
            <Send className="size-4" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">{labels.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-6">
        {status === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {labels.loading}
          </div>
        ) : status === "linked" ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Check className="size-4" />
              {labels.statusLinked}
            </div>
            <Button type="button" variant="outline" onClick={onDisconnectRequest} className="h-11">
              {labels.disconnect}
            </Button>
          </div>
        ) : pendingToken ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{labels.instructions}</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3">
              <code className="flex-1 truncate font-mono text-sm text-foreground">/link {pendingToken.token}</code>
              <Button type="button" size="sm" variant="ghost" onClick={onCopy} aria-label={labels.copy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {labels.expiresAt(new Date(pendingToken.expiresAt).toLocaleTimeString())}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{labels.statusNotLinked}</p>
            <Button type="button" onClick={onGenerate} disabled={isGenerating} className="h-11">
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {labels.generating}
                </>
              ) : (
                labels.generate
              )}
            </Button>
          </div>
        )}

        {generateFailed ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {labels.generateFailed}
          </div>
        ) : null}
      </CardContent>

      <AppModal
        open={confirmingDisconnect}
        onOpenChange={(open) => { if (!open) onDisconnectCancel(); }}
        isPending={isRevoking}
        size="sm"
        role="alertdialog"
        title={labels.disconnectConfirmTitle}
        description={labels.disconnectConfirmDescription}
        footer={
          <>
            <ModalCancelButton isPending={isRevoking} onClick={onDisconnectCancel}>
              {labels.cancel}
            </ModalCancelButton>
            <ModalSubmitButton
              type="button"
              variant="destructive"
              isPending={isRevoking}
              pendingLabel={labels.deleting}
              onClick={onDisconnectConfirm}
            >
              {labels.disconnect}
            </ModalSubmitButton>
          </>
        }
      />
    </Card>
  );
}
