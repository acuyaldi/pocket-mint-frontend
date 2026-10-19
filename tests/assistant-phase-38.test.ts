import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import enMessages from "@/messages/en.json";
import idMessages from "@/messages/id.json";
import { AssistantConversation } from "@/src/features/assistant/components/AssistantConversation";
import { AssistantRecoveryBanner, type AssistantRecoveryBannerLabels } from "@/src/features/assistant/components/AssistantRecoveryBanner";
import { ClarificationCard, type ClarificationCardLabels } from "@/src/features/assistant/components/ClarificationCard";
import * as conversationStories from "@/src/features/assistant/components/AssistantConversation.stories";
import { findOriginalUserMessage } from "@/src/features/assistant/hooks/useAssistantConversationFlow";
import { resolveRecoveryState, type AssistantRecoveryState } from "@/src/features/assistant/types/recovery";
import { isClarificationRequest } from "@/src/features/assistant/utils/clarification";
import { readAssistantTerminalCondition, type AssistantTerminalCondition } from "@/src/features/assistant/utils/errors";
import type { AssistantSession, ClarificationRequest } from "@/src/types/assistant";

const TRANSFER = enMessages.assistant.clarification.transfer;
const TERMINAL = enMessages.assistant.recovery.terminal;

const BANNER_LABELS: AssistantRecoveryBannerLabels = {
  recoveryLoading: "Checking",
  transientLostTitle: "Lost",
  clarificationRecoveredTitle: "Pending question",
  turnRunning: "Running",
  cancel: "Cancel",
  cancelling: "Cancelling",
  terminal: TERMINAL,
  transfer: TRANSFER,
};

const CARD_LABELS: ClarificationCardLabels = {
  cancel: "Cancel",
  cancelling: "Cancelling",
  titleByEntity: { wallet: "Choose wallet", merchant: "Choose merchant", category: "Choose category" },
  descriptionByEntity: { wallet: "Select the wallet.", merchant: "Select the merchant.", category: "Select the category." },
  transfer: TRANSFER,
};

const apiError = (code: string, detail?: string) => ({ response: { data: { error: { code, message: "free text never read", detail } } } });

/** Rendered text only — attributes and markup stripped. */
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
const buttons = (html: string) => [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((m) => text(m[1]!).trim());

const CONFIRM_LABELS = [
  enMessages.assistant.draftReview.confirm,
  enMessages.assistant.draftReview.confirmTransaction,
  "Save Transaction",
  "Confirm",
];

describe("Phase 38 — terminal markers map from structured fields only", () => {
  it.each([
    [apiError("ASSISTANT_DRAFT_CONFLICT", "EXPIRED"), { kind: "expired" }],
    [apiError("ASSISTANT_DRAFT_CONFLICT", "FAILED"), { kind: "failed" }],
    [apiError("ASSISTANT_DRAFT_CONFLICT", "CANCELLED"), { kind: "cancelled" }],
    [apiError("ASSISTANT_DRAFT_CONFLICT", "COMMITTED"), { kind: "notActionable", reason: "committed" }],
    [apiError("ASSISTANT_DRAFT_CONFLICT", "TERMINAL"), { kind: "notActionable", reason: "unknown" }],
    [apiError("ASSISTANT_DRAFT_CONFLICT"), { kind: "notActionable", reason: "unknown" }],
    [apiError("ASSISTANT_CLARIFICATION_EXPIRED"), { kind: "expired" }],
    [apiError("ASSISTANT_CLARIFICATION_CANCELLED"), { kind: "cancelled" }],
    [apiError("ASSISTANT_CLARIFICATION_ALREADY_CONSUMED"), { kind: "notActionable", reason: "consumed" }],
    [apiError("ASSISTANT_CLARIFICATION_STALE"), { kind: "notActionable", reason: "stale" }],
    [apiError("ASSISTANT_CONVERSATION_NOT_CONTINUABLE"), { kind: "notActionable", reason: "archived" }],
  ])("%j → %j", (error, expected) => {
    expect(readAssistantTerminalCondition(error)).toEqual(expected);
  });

  it("never parses the message text: a non-terminal code stays null even if its message says 'expired'", () => {
    const error = { response: { data: { error: { code: "ASSISTANT_PROVIDER_UNAVAILABLE", message: "draft EXPIRED FAILED cancelled" } } } };
    expect(readAssistantTerminalCondition(error)).toBeNull();
    expect(readAssistantTerminalCondition(new Error("EXPIRED"))).toBeNull();
  });
});

describe("Phase 38 — recovery-state after refresh", () => {
  it("an archived conversation with nothing actionable is notActionable/archived", () => {
    expect(resolveRecoveryState({}, { conversationStatus: "ARCHIVED" })).toEqual({
      kind: "terminal",
      condition: { kind: "notActionable", reason: "archived" },
    });
  });

  it("a still-actionable item wins over the archived status", () => {
    const state = resolveRecoveryState(
      { activeTurn: { turnId: "t", intent: "transaction.create", startedAt: "2026-10-19T00:00:00Z" } },
      { conversationStatus: "ARCHIVED" }
    );
    expect(state.kind).toBe("turnRunning");
  });

  const terminal = (status: "CONSUMED" | "CANCELLED" | "STALE", terminalCode?: string) => ({
    latestTerminalClarification: { clarificationId: "c", entityType: "wallet" as const, status, terminalCode, restartRequired: true },
  });

  it.each([
    [terminal("CANCELLED"), { kind: "cancelled" }],
    [terminal("STALE", "expired"), { kind: "expired" }],
    [terminal("STALE", "context_invalid"), { kind: "notActionable", reason: "stale" }],
  ])("latest terminal clarification %j → %j when the last turn was a clarification action", (response, condition) => {
    expect(resolveRecoveryState(response, { conversationStatus: "ACTIVE", latestTurnIntent: "clarification.cancel" })).toEqual({
      kind: "terminal",
      condition,
    });
  });

  it("a terminal clarification is history once the conversation moved on — not reported as the current state", () => {
    expect(resolveRecoveryState(terminal("CANCELLED"), { conversationStatus: "ACTIVE", latestTurnIntent: "transaction.create" }).kind).toBe(
      "transientClarificationLost"
    );
    expect(resolveRecoveryState(terminal("CONSUMED"), { latestTurnIntent: "clarification.select" }).kind).toBe("transientClarificationLost");
  });
});

describe("Phase 38 — terminal recovery UI", () => {
  const renderBanner = (condition: AssistantTerminalCondition, onResend?: () => void) =>
    renderToStaticMarkup(
      React.createElement(AssistantRecoveryBanner, { kind: "terminal", condition, onResend, isResending: false, labels: BANNER_LABELS })
    );

  it.each<[AssistantTerminalCondition, string]>([
    [{ kind: "expired" }, TERMINAL.description.expired],
    [{ kind: "failed" }, TERMINAL.description.failed],
    [{ kind: "cancelled" }, TERMINAL.description.cancelled],
    [{ kind: "notActionable", reason: "archived" }, TERMINAL.description.archived],
  ])("%j shows its own title and explanation, and never a Confirm button", (condition, description) => {
    const html = renderBanner(condition, () => {});
    expect(text(html)).toContain(TERMINAL.title[condition.kind]);
    expect(text(html)).toContain(description);
    for (const label of CONFIRM_LABELS) expect(buttons(html)).not.toContain(label);
  });

  it("expired and failed offer exactly one action: resend as a new draft", () => {
    expect(buttons(renderBanner({ kind: "expired" }, () => {}))).toEqual([TERMINAL.resend]);
    expect(buttons(renderBanner({ kind: "failed" }, () => {}))).toEqual([TERMINAL.resend]);
  });

  it("without the original message, expired/failed explain how to retype instead of showing a button", () => {
    const html = renderBanner({ kind: "failed" });
    expect(buttons(html)).toEqual([]);
    expect(text(html)).toContain(TERMINAL.resendUnavailable);
  });

  it("cancelled and not-actionable are information only — no buttons at all, even when a resend handler exists", () => {
    expect(buttons(renderBanner({ kind: "cancelled" }, () => {}))).toEqual([]);
    expect(buttons(renderBanner({ kind: "notActionable", reason: "archived" }, () => {}))).toEqual([]);
    expect(buttons(renderBanner({ kind: "notActionable", reason: "committed" }, () => {}))).toEqual([]);
  });

  it.each<AssistantTerminalCondition>([
    { kind: "expired" },
    { kind: "failed" },
    { kind: "cancelled" },
    { kind: "notActionable", reason: "archived" },
  ])("the whole conversation in terminal %j renders no Confirm/Save Transaction button", (condition) => {
    const args = conversationStories.TerminalExpiredAfterRefresh.args!;
    const recoveryState: AssistantRecoveryState = { kind: "terminal", condition };
    const html = renderToStaticMarkup(
      React.createElement(AssistantConversation, { ...(args as React.ComponentProps<typeof AssistantConversation>), recoveryState })
    );
    for (const label of CONFIRM_LABELS) expect(buttons(html)).not.toContain(label);
  });

  it("archived disables the composer with its own reason", () => {
    const html = renderToStaticMarkup(
      React.createElement(AssistantConversation, {
        ...(conversationStories.TerminalArchivedAfterRefresh.args as React.ComponentProps<typeof AssistantConversation>),
      })
    );
    expect(text(html)).toContain(enMessages.assistant.recovery.composerDisabledArchived);
  });
});

describe("Phase 38 — transfer clarification source vs destination", () => {
  const base: ClarificationRequest = {
    clarificationId: "clar-t",
    entityType: "wallet",
    prompt: "backend prompt",
    options: [
      { token: "a", label: "BCA Debit" },
      { token: "b", label: "BCA Payroll" },
    ],
    expiresAt: "2026-10-19T15:30:00.000Z",
  };
  const renderCard = (clarification: ClarificationRequest) =>
    renderToStaticMarkup(
      React.createElement(ClarificationCard, {
        clarification,
        pendingToken: null,
        isSelecting: false,
        isCancelling: false,
        onSelect: () => {},
        onCancel: () => {},
        labels: CARD_LABELS,
      })
    );

  it("source question asks 'from', with no chosen-source line", () => {
    const html = renderCard({ ...base, transfer: { field: "SOURCE_WALLET" } });
    expect(html).toContain(`>${TRANSFER.question.SOURCE_WALLET}</h2>`);
    expect(text(html)).toContain(TRANSFER.description.SOURCE_WALLET);
    expect(text(html)).not.toContain(TRANSFER.question.DESTINATION_WALLET);
    expect(html).not.toContain("aria-describedby");
  });

  it("destination question shows the chosen source before asking 'to', and announces it with the heading", () => {
    const html = renderCard({ ...base, transfer: { field: "DESTINATION_WALLET", sourceWalletLabel: "GoPay" } });
    const sourceAt = html.indexOf("GoPay");
    const headingAt = html.indexOf(`>${TRANSFER.question.DESTINATION_WALLET}</h2>`);
    expect(sourceAt).toBeGreaterThan(-1);
    expect(headingAt).toBeGreaterThan(sourceAt);
    expect(text(html)).toContain(`${TRANSFER.from}: GoPay`);
    const describedBy = html.match(/<h2[^>]*aria-describedby="([^"]+)"/)?.[1];
    expect(describedBy && html.includes(`id="${describedBy}"`)).toBe(true);
  });

  it("a non-transfer wallet clarification keeps the generic copy and the backend prompt", () => {
    const html = renderCard(base);
    expect(text(html)).toContain("Choose wallet");
    expect(text(html)).toContain("backend prompt");
    expect(text(html)).not.toContain(TRANSFER.question.SOURCE_WALLET);
  });

  it("the recovered (read-only) transfer clarification keeps its slot after a refresh", () => {
    const html = renderToStaticMarkup(
      React.createElement(AssistantRecoveryBanner, {
        kind: "clarificationRecovered",
        clarification: { ...base, options: [{ label: "BCA Debit" }], transfer: { field: "DESTINATION_WALLET", sourceWalletLabel: "GoPay" } },
        isCancelling: false,
        onCancel: () => {},
        labels: BANNER_LABELS,
      })
    );
    expect(text(html)).toContain(`${TRANSFER.from}: GoPay`);
    expect(text(html)).toContain(TRANSFER.question.DESTINATION_WALLET);
  });

  it("validates the transfer field as a closed enum", () => {
    expect(isClarificationRequest({ ...base, transfer: { field: "SOURCE_WALLET" } })).toBe(true);
    expect(isClarificationRequest({ ...base, transfer: { field: "DESTINATION_WALLET", sourceWalletLabel: "GoPay" } })).toBe(true);
    expect(isClarificationRequest({ ...base, transfer: { field: "WALLET" } })).toBe(false);
    expect(isClarificationRequest({ ...base, transfer: { field: "SOURCE_WALLET", sourceWalletLabel: 1 } })).toBe(false);
  });

  it("Indonesian copy is unambiguous: 'Dari wallet mana?' vs 'Ke wallet mana?'", () => {
    expect(idMessages.assistant.clarification.transfer.question).toEqual({
      SOURCE_WALLET: "Dari wallet mana?",
      DESTINATION_WALLET: "Ke wallet mana?",
    });
  });
});

describe("Phase 38 — resend picks the original instruction by structured fields", () => {
  const session = (items: AssistantSession["messages"]["items"], turns: { id: string; intent: string }[]) =>
    ({ messages: { items }, turns }) as unknown as AssistantSession;
  const msg = (turnId: string, content: string, source = "USER_PROVIDED", role = "USER") =>
    ({ id: `${turnId}-${role}`, turnId, role, source, content, createdAt: "" }) as AssistantSession["messages"]["items"][number];

  it("skips clarification-action turns and canonical confirm messages", () => {
    const s = session(
      [
        msg("t1", "transfer 50rb dari BCA ke GoPay"),
        msg("t1", "Pilih wallet", "PROVIDER_CLARIFICATION", "ASSISTANT"),
        msg("t2", "Pilih opsi klarifikasi."),
        msg("t3", "Konfirmasi draft transaksi d1.", "CANONICAL_FALLBACK"),
      ],
      [
        { id: "t1", intent: "transaction.create" },
        { id: "t2", intent: "clarification.select" },
        { id: "t3", intent: "draft.confirm" },
      ]
    );
    expect(findOriginalUserMessage(s)).toBe("transfer 50rb dari BCA ke GoPay");
  });

  it("returns null when the original isn't on the loaded page", () => {
    expect(findOriginalUserMessage(session([msg("t2", "Pilih opsi klarifikasi.")], [{ id: "t2", intent: "clarification.select" }]))).toBeNull();
    expect(findOriginalUserMessage(undefined)).toBeNull();
  });
});

describe("Phase 38 — i18n parity", () => {
  it("en and id define the same terminal and transfer keys", () => {
    const keys = (o: unknown, prefix = ""): string[] =>
      typeof o === "object" && o !== null
        ? Object.entries(o).flatMap(([k, v]) => keys(v, `${prefix}${k}.`))
        : [prefix];
    expect(keys(idMessages.assistant.recovery.terminal)).toEqual(keys(enMessages.assistant.recovery.terminal));
    expect(keys(idMessages.assistant.clarification.transfer)).toEqual(keys(enMessages.assistant.clarification.transfer));
  });
});
