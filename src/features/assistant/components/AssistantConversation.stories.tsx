import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantConversation, type AssistantConversationLabels } from "./AssistantConversation";
import type { AssistantMessage, AssistantDraft, AssistantRecoveryClarification, ClarificationRequest, GuidedClarification } from "@/src/types/assistant";
import { resolveRecoveryState, type AssistantRecoveryState } from "@/src/features/assistant/types/recovery";
import en from "@/messages/en.json";

const LABELS: AssistantConversationLabels = {
  regionLabel: "Assistant conversation",
  listLabel: "Conversation messages",
  historyLoading: "Loading conversation...",
  historyRetry: "Retry",
  message: { USER: "You", ASSISTANT: "Assistant", SYSTEM: "System", telegramChannel: "Sent from Telegram" },
  emptyTitle: "Start a new conversation",
  emptyDescription: "Describe one income or expense in your own words and Pocket Mint Assistant will help you record it.",
  examplesLabel: "Examples",
  examples: ["bayar internet 350 ribu dari BCA", "gaji bulan ini masuk ke BCA 8 juta"],
  pendingResponse: "Waiting for the assistant's response...",
  continueLabel: "New instruction",
  composer: {
    label: "What would you like to record?",
    placeholder: "e.g. bayar internet 350 ribu dari BCA",
    helper: "Describe one income or expense in your own words.",
    submit: "Send",
    submitting: "Sending",
  },
  composerDisabledClarification: "Answer the clarification above before sending a new instruction.",
  composerDisabledDraft: "Confirm or cancel the draft above before sending a new instruction.",
  composerDisabledOutcomeUnknown: "Check what happened with your previous action above before sending a new instruction.",
  composerDisabledTurnRunning: "Your previous message is still being processed. Please wait before sending another one.",
  composerDisabledArchived: en.assistant.recovery.composerDisabledArchived,
  clarification: {
    cancel: "Cancel",
    cancelling: "Cancelling",
    titleByEntity: {
      wallet: "Choose wallet",
      merchant: "Choose merchant",
      category: "Choose category",
    },
    descriptionByEntity: {
      wallet: "Select the wallet that should fund this transaction.",
      merchant: "Select the merchant Pocket Mint should use.",
      category: "Select one of your existing categories.",
    },
    transfer: en.assistant.clarification.transfer,
  },
  guidedClarification: {
    field: { category: "Category", date: "Date" },
    submit: "Continue",
    cancel: "Cancel",
  },
  draft: {
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
    from: "From",
    to: "To",
    wallet: "Wallet",
    category: "Category",
    merchant: "Merchant",
    date: "Date",
    notes: "Notes",
    expiresAt: "Expires",
    statusValues: {
      PENDING_CONFIRMATION: "Awaiting confirmation",
      COMMITTED: "Confirmed",
      CANCELLED: "Cancelled",
      EXPIRED: "Expired",
      FAILED: "Failed",
    },
    edit: "Edit",
    saveChanges: "Save Changes",
    cancelEdit: "Cancel",
  },
  draftActions: { confirm: "Confirm", confirming: "Confirming", cancel: "Cancel", cancelling: "Cancelling" },
  draftEdit: {
    edit: "Edit",
    saveChanges: "Save Changes",
    saving: "Saving",
    cancelEdit: "Cancel",
    confirmTransaction: "Save Transaction",
    confirming: "Confirming",
    cancel: "Cancel",
    cancelling: "Cancelling",
  },
  reviewHeading: "Transaction Review",
  recoveryBanner: {
    recoveryLoading:
      "Checking this conversation's recovery status before showing any clarification or draft that may still be pending after the page reload. You are still in the same conversation.",
    transientLostTitle: "The pending clarification for this conversation couldn't be restored after reloading.",
    clarificationRecoveredTitle: "You still have a pending question in this conversation",
    turnRunning: "Your previous message in this conversation is still being processed. Please wait before sending another one.",
    cancel: "Cancel",
    cancelling: "Cancelling",
    terminal: en.assistant.recovery.terminal,
    transfer: en.assistant.clarification.transfer,
  },
  outcomeUnknown: {
    heading: "We couldn't confirm what happened",
    description: "Your previous action may or may not have gone through. Check the conversation to see the real outcome, or try again if it's safe to do so.",
    check: "Check conversation",
    checking: "Checking",
    retry: "Try again",
    retrying: "Trying again",
  },
};

const MESSAGES: AssistantMessage[] = [
  {
    id: "msg-1",
    turnId: "turn-1",
    role: "USER",
    source: "USER_PROVIDED",
    content: "bayar internet 350 ribu dari BCA",
    createdAt: "2026-07-25T10:00:00.000Z",
  },
  {
    id: "msg-2",
    turnId: "turn-1",
    role: "ASSISTANT",
    source: "DETERMINISTIC_RENDERER",
    content: "Rp350.000 expense at Internet from BCA, categorized as Tagihan.",
    createdAt: "2026-07-25T10:00:01.000Z",
  },
];

// A provider clarification persists as an ordinary ASSISTANT turn (backend
// source `PROVIDER_CLARIFICATION`) — a bounded free-form question, not a
// pick-an-option payload. `AssistantMessage` renders by role, so it reads as a
// normal assistant bubble; the difference is only that it's answered by typing.
const PROVIDER_CLARIFICATION_MESSAGES: AssistantMessage[] = [
  {
    id: "msg-1",
    turnId: "turn-1",
    role: "USER",
    source: "USER_PROVIDED",
    content: "bayar internet 350 ribu dari BCA",
    createdAt: "2026-07-25T10:00:00.000Z",
  },
  {
    id: "msg-2",
    turnId: "turn-1",
    role: "ASSISTANT",
    source: "PROVIDER_CLARIFICATION",
    content: "Untuk transaksi ini, kategorinya apa dan tanggal berapa?",
    createdAt: "2026-07-25T10:00:01.000Z",
  },
];

const CLARIFICATION: ClarificationRequest = {
  clarificationId: "clar-1",
  entityType: "wallet",
  prompt: 'Which wallet did you mean by "BCA"?',
  options: [
    { token: "tok-1", label: "BCA Tabungan", discriminator: "BANK" },
    { token: "tok-2", label: "BCA Kartu Kredit", discriminator: "CREDIT_CARD" },
  ],
  expiresAt: "2026-07-25T15:30:00.000Z",
};

const GUIDED_CLARIFICATION: GuidedClarification = {
  kind: "guided",
  clarificationId: "clar-guided-1",
  fields: [
    { field: "category", required: true, input: { type: "text", placeholder: "Nama kategori" } },
    { field: "date", required: true, input: { type: "date" } },
  ],
  expiresAt: "2026-07-25T15:30:00.000Z",
};

const RECOVERED_CLARIFICATION: AssistantRecoveryClarification = {
  clarificationId: "clar-1",
  entityType: "wallet",
  prompt: 'Which wallet did you mean by "BCA"?',
  options: [{ label: "BCA Tabungan", discriminator: "BANK" }, { label: "BCA Kartu Kredit", discriminator: "CREDIT_CARD" }],
  expiresAt: "2026-07-25T15:30:00.000Z",
};

const RECOVERED_DRAFT: AssistantDraft = {
  draftId: "draft-2",
  status: "PENDING_CONFIRMATION",
  expiresAt: "2026-07-25T15:30:00.000Z",
  confirmationRequired: true,
  renderedText: "",
  preview: {
    type: "EXPENSE",
    amount: 50000,
    wallet: "wallet-1",
    walletId: "wallet-1",
    categoryId: "category-1",
    category: "category-1",
    date: "2026-07-25",
    transactionDate: "2026-07-25",
  },
};

const DRAFT: AssistantDraft = {
  draftId: "draft-1",
  status: "PENDING_CONFIRMATION",
  expiresAt: "2026-07-25T15:30:00.000Z",
  confirmationRequired: true,
  renderedText: "Rp50.000 expense at Indomaret from BCA, categorized as Makanan.",
  preview: {
    type: "EXPENSE",
    amount: 50000,
    wallet: "BCA",
    walletId: "wallet-1",
    categoryId: "category-1",
    category: "Makanan",
    merchant: "Indomaret",
    date: "2026-07-25",
    transactionDate: "2026-07-25",
  },
};

const meta: Meta<typeof AssistantConversation> = {
  title: "Features/Assistant/AssistantConversation",
  component: AssistantConversation,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssistantConversation>;

const BASE = {
  conversationId: null as string | null,
  messages: [] as AssistantMessage[],
  isLoadingHistory: false,
  historyErrorMessage: null as string | null,
  onRetryHistory: fn(),
  recoveryState: { kind: "ready" } as AssistantRecoveryState,
  activeWorkflow: null,
  lastResult: null,
  instructionText: "",
  onInstructionChange: fn(),
  onSubmit: fn(),
  isSendingMessage: false,
  formError: null as string | null,
  pendingOptionToken: null as string | null,
  isSelectingClarification: false,
  isCancellingClarification: false,
  onSelectOption: fn(),
  onSubmitGuidedFields: fn(),
  onCancelClarification: fn(),
  isConfirmingDraft: false,
  isCancellingDraft: false,
  onConfirmDraft: fn(),
  onCancelDraft: fn(),
  isCheckingOutcome: false,
  onCheckOutcome: fn(),
  onRetryOutcome: fn(),
  onStartNewConversation: fn(),
  intlLocale: "id-ID",
  labels: LABELS,
  isEditingDraft: false,
  draftOverrides: {},
  onStartEditDraft: fn(),
  onCancelEditDraft: fn(),
  onSaveEditDraft: fn(),
  onDraftOverrideChange: fn(),
} satisfies ComponentProps<typeof AssistantConversation>;

export const EmptyConversation: Story = {
  args: BASE,
};

export const WithMessages: Story = {
  args: { ...BASE, conversationId: "conv-1", messages: MESSAGES },
};

/**
 * Regression cover for fix/assistant-conversation-response-ui: a provider
 * clarification ("what is the category and date?") is a conversational turn in
 * the timeline, with the composer left open so the user answers by typing. It
 * previously reset the conversation and left the empty-state card visible.
 */
export const ProviderClarification: Story = {
  args: { ...BASE, conversationId: "conv-1", messages: PROVIDER_CLARIFICATION_MESSAGES },
};

export const PendingResponse: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    instructionText: "gaji bulan ini masuk ke BCA 8 juta",
    isSendingMessage: true,
  },
};

export const RetrievalError: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    historyErrorMessage: "Couldn't load this conversation. Please try again.",
  },
};

export const WithClarification: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    activeWorkflow: { kind: "clarification", clarification: CLARIFICATION },
  },
};

export const WithGuidedClarification: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    activeWorkflow: {
      kind: "guidedClarification",
      clarification: GUIDED_CLARIFICATION,
      prompt: "Beberapa detail transaksi belum lengkap. Lengkapi kategori dan tanggal transaksi.",
    },
  },
};

export const WithDraftReview: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    activeWorkflow: { kind: "draft", draft: DRAFT },
  },
};

export const ConfirmedResult: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    lastResult: { renderedText: "Draft draft-1 sudah dikonfirmasi. Transaksi txn-1 telah dibuat." },
  },
};

export const TransientUnavailableAfterRefresh: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    recoveryState: { kind: "transientClarificationLost" },
  },
};

export const ClarificationRecoveredAfterRefresh: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    recoveryState: { kind: "clarificationRecovered", clarification: RECOVERED_CLARIFICATION },
  },
};

export const DraftRecoveredAfterRefresh: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    recoveryState: { kind: "draftRecovered", draft: RECOVERED_DRAFT },
  },
};

export const ActionOutcomeUnknownWithRetry: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    recoveryState: { kind: "actionOutcomeUnknown", action: "confirmDraft" },
  },
};

export const ActionOutcomeUnknownWithoutRetry: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    recoveryState: { kind: "actionOutcomeUnknown", action: "sendMessage" },
  },
};

/** Phase 38 — recovery terminal states: a message and an action, never a Confirm button. */
export const TerminalExpiredAfterRefresh: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    recoveryState: { kind: "terminal", condition: { kind: "expired" } },
    onResendAsNewDraft: fn(),
  },
};

export const TerminalFailedAfterRefresh: Story = {
  args: { ...TerminalExpiredAfterRefresh.args, recoveryState: { kind: "terminal", condition: { kind: "failed" } } },
};

export const TerminalCancelledAfterRefresh: Story = {
  args: { ...TerminalExpiredAfterRefresh.args, recoveryState: { kind: "terminal", condition: { kind: "cancelled" } } },
};

export const TerminalArchivedAfterRefresh: Story = {
  args: {
    ...TerminalExpiredAfterRefresh.args,
    recoveryState: { kind: "terminal", condition: { kind: "notActionable", reason: "archived" } },
  },
};

/**
 * Phase 38.1 — the recovery state is derived from a real recovery-state
 * payload (effective status + turn link), so the terminal card shows straight
 * after a refresh, with no stale card and no 409 first.
 */
const TERMINAL_TITLE = en.assistant.recovery.terminal.title;
const REFRESH_TURNS = [{ id: "turn-1", intent: "transaction.create" }];
const expectTerminalWithoutConfirm = (title: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText(title)).toBeInTheDocument();
  for (const name of [en.assistant.draftReview.confirm, en.assistant.draftReview.confirmTransaction]) {
    await expect(canvas.queryByRole("button", { name })).not.toBeInTheDocument();
  }
};

export const UntouchedExpiredDraftAfterRefresh: Story = {
  args: {
    ...TerminalExpiredAfterRefresh.args,
    recoveryState: resolveRecoveryState(
      { latestTerminalDraft: { draftId: "draft-1", status: "EXPIRED", recordedStatus: "PENDING_CONFIRMATION", originatingTurnId: "turn-1" } },
      { conversationStatus: "ACTIVE", turns: REFRESH_TURNS }
    ),
  },
  play: expectTerminalWithoutConfirm(TERMINAL_TITLE.expired),
};

export const FailedDraftAfterRefresh: Story = {
  args: {
    ...TerminalExpiredAfterRefresh.args,
    recoveryState: resolveRecoveryState(
      { latestTerminalDraft: { draftId: "draft-1", status: "FAILED", recordedStatus: "FAILED", originatingTurnId: "turn-1" } },
      { conversationStatus: "ACTIVE", turns: [...REFRESH_TURNS, { id: "turn-2", intent: "transaction.create.confirm" }] }
    ),
  },
  play: expectTerminalWithoutConfirm(TERMINAL_TITLE.failed),
};

export const UntouchedExpiredClarificationAfterRefresh: Story = {
  args: {
    ...TerminalExpiredAfterRefresh.args,
    recoveryState: resolveRecoveryState(
      {
        latestTerminalClarification: {
          clarificationId: "clar-1",
          entityType: "wallet",
          status: "STALE",
          terminalCode: "expired",
          restartRequired: true,
          recordedStatus: "PENDING",
          originatingTurnId: "turn-1",
        },
      },
      { conversationStatus: "ACTIVE", turns: REFRESH_TURNS }
    ),
  },
  play: expectTerminalWithoutConfirm(TERMINAL_TITLE.expired),
};

/** A draft still pending inside an archived conversation: the backend refuses confirm until restore, so no Confirm here. */
export const ArchivedWithPendingDraftAfterRefresh: Story = {
  args: {
    ...TerminalExpiredAfterRefresh.args,
    recoveryState: resolveRecoveryState(
      {
        pendingDraft: {
          draftId: "draft-1",
          status: "PENDING_CONFIRMATION",
          preview: {
            operation: "transaction.create",
            type: "EXPENSE",
            amount: "350000",
            walletId: "wallet-1",
            categoryId: "category-1",
            date: "2026-10-19",
            transactionDate: "2026-10-19",
            expiresAt: "2026-10-19T15:30:00.000Z",
          },
        },
      },
      { conversationStatus: "ARCHIVED", turns: REFRESH_TURNS }
    ),
  },
  play: expectTerminalWithoutConfirm(TERMINAL_TITLE.notActionable),
};

/** Phase 38 — TRANSFER destination question after the source was chosen. */
export const WithTransferDestinationClarification: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    activeWorkflow: {
      kind: "clarification",
      clarification: {
        clarificationId: "clar-transfer",
        entityType: "wallet",
        prompt: "Dari: GoPay. Ke wallet mana? Pilih salah satu: BCA Debit (BANK), BCA Payroll (BANK).",
        options: [
          { token: "tok-t-1", label: "BCA Debit", discriminator: "BANK" },
          { token: "tok-t-2", label: "BCA Payroll", discriminator: "BANK" },
        ],
        expiresAt: "2026-10-19T15:30:00.000Z",
        transfer: { field: "DESTINATION_WALLET", sourceWalletLabel: "GoPay" },
      },
    },
  },
};

export const ComposerDisabledDuringClarification: Story = {
  args: WithClarification.args,
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: WithMessages.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: WithMessages.args,
};

export const SubmitInteraction: Story = {
  args: { ...BASE, instructionText: "bayar internet 350 ribu dari BCA" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.composer.submit }));
    expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};

export const ClarificationSelectInteraction: Story = {
  args: WithClarification.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /BCA Tabungan/ }));
    expect(args.onSelectOption).toHaveBeenCalledWith("tok-1");
  },
};
