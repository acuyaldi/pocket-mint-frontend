"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel, FormErrorMessage } from "@/components/ui/form-field";
import type { WalletAlias } from "@/src/types/wallet";
import { getApiErrorMessage } from "@/lib/api-errors";

// Bounded input, mirroring the server's per-alias byte budget — the server
// remains the source of truth (128 bytes, UTF-8); this just stops an
// obviously-oversized draft before a round trip.
const ALIAS_INPUT_MAX_LENGTH = 60;

export interface WalletAliasManagerProps {
  aliases: WalletAlias[];
  /** Rejects with the caught mutation error so the caller's server message can be shown inline. */
  onAdd: (aliasDisplay: string) => Promise<void>;
  onRemove: (aliasId: string) => Promise<void>;
  isAdding: boolean;
  /** The alias currently being removed, if any — drives its own busy state. */
  removingId: string | null;
}

/**
 * Compact "also known as" section embedded in EditWalletModal. Create and
 * delete only — no rename endpoint exists, so renaming an alias here is
 * delete-then-recreate. Never promises fuzzy matching: aliases are exact,
 * deterministic names Assistant transaction capture also accepts.
 *
 * Presentational by design (mutations are owned by the caller) so it can be
 * exercised in Storybook without a live backend — mirrors
 * ClarificationOptions' callback-prop shape rather than calling a TanStack
 * Query hook internally.
 */
export function WalletAliasManager({ aliases, onAdd, onRemove, isAdding, removingId }: WalletAliasManagerProps) {
  const t = useTranslations("walletModals.edit.aliases");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    const aliasDisplay = draft.trim();
    if (!aliasDisplay) return;
    setError("");
    try {
      await onAdd(aliasDisplay);
      setDraft("");
    } catch (caught) {
      setError(getApiErrorMessage(caught) ?? t("genericError"));
    }
  };

  const handleRemove = async (aliasId: string) => {
    setError("");
    try {
      await onRemove(aliasId);
    } catch (caught) {
      setError(getApiErrorMessage(caught) ?? t("genericError"));
    }
  };

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor="wallet-alias-input">{t("label")}</FieldLabel>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>

      {aliases.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("listAria")}>
          {aliases.map((alias) => {
            const isRemoving = removingId === alias.id;
            return (
              <li
                key={alias.id}
                className="flex items-center gap-1 rounded-full border border-border/70 bg-muted py-1 pl-3 pr-1 text-sm text-foreground"
              >
                <span className="max-w-48 truncate">{alias.aliasDisplay}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("removeAria", { name: alias.aliasDisplay })}
                  aria-busy={isRemoving}
                  disabled={isRemoving}
                  onClick={() => handleRemove(alias.id)}
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          id="wallet-alias-input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={ALIAS_INPUT_MAX_LENGTH}
          placeholder={t("placeholder")}
          aria-label={t("label")}
          className="h-10 border-border/70 bg-card px-3 text-sm"
        />
        <Button type="submit" variant="outline" disabled={isAdding || !draft.trim()}>
          <Plus />
          {t("add")}
        </Button>
      </form>

      <FormErrorMessage message={error} />
    </div>
  );
}
