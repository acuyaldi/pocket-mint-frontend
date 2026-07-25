import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantConversation, type AssistantConversationLabels } from "./AssistantConversation";
import type { AssistantMessage, AssistantDraft, ClarificationRequest } from "@/src/types/assistant";

const LABELS: AssistantConversationLabels = {
  regionLabel: "Assistant conversation",
  listLabel: "Conversation messages",
  historyLoading: "Loading conversation...",
  historyRetry: "Retry",
  message: { USER: "You", ASSISTANT: "Assistant", SYSTEM: "System" },
  emptyTitle: "Start a new conversation",
  emptyDescription: "Describe one income or expense in your own words and Pocket Mint Assistant will help you record it.",
  examplesLabel: "Examples",
  examples: ["bayar internet 350 ribu dari BCA", "gaji bulan ini masuk ke BCA 8 juta"],
  pendingResponse: "Waiting for the assistant's response...",
  transientUnavailable: "The pending clarification for this conversation couldn't be restored after reloading.",
  newConversation: "New conversation",
  resetBlocked: "Resolve the current clarification or draft before starting a new conversation.",
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
  clarification: { cancel: "Cancel", cancelling: "Cancelling" },
  draft: {
    income: "Income",
    expense: "Expense",
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
  },
  draftActions: { confirm: "Confirm", confirming: "Confirming", cancel: "Cancel", cancelling: "Cancelling" },
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
    category: "Makanan",
    merchant: "Indomaret",
    date: "2026-07-25",
  },
};

const meta: Meta<typeof AssistantConversation> = {
  title: "Features/Assistant/AssistantConversation",
  component: AssistantConversation,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-4">
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
  showTransientUnavailable: false,
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
  onCancelClarification: fn(),
  isConfirmingDraft: false,
  isCancellingDraft: false,
  onConfirmDraft: fn(),
  onCancelDraft: fn(),
  canStartNewConversation: true,
  onStartNewConversation: fn(),
  intlLocale: "id-ID",
  labels: LABELS,
} satisfies ComponentProps<typeof AssistantConversation>;

export const EmptyConversation: Story = {
  args: BASE,
};

export const WithMessages: Story = {
  args: { ...BASE, conversationId: "conv-1", messages: MESSAGES },
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
    canStartNewConversation: false,
  },
};

export const WithDraftReview: Story = {
  args: {
    ...BASE,
    conversationId: "conv-1",
    messages: MESSAGES,
    activeWorkflow: { kind: "draft", draft: DRAFT },
    canStartNewConversation: false,
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
    showTransientUnavailable: true,
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

export const NewConversationInteraction: Story = {
  args: { ...BASE, conversationId: "conv-1", messages: MESSAGES },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.newConversation }));
    expect(args.onStartNewConversation).toHaveBeenCalledOnce();
  },
};

export const ClarificationSelectInteraction: Story = {
  args: WithClarification.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "BCA Tabungan" }));
    expect(args.onSelectOption).toHaveBeenCalledWith("tok-1");
  },
};
