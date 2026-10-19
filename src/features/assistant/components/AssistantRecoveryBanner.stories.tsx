import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantRecoveryBanner, type AssistantRecoveryBannerLabels } from "./AssistantRecoveryBanner";
import type { AssistantRecoveryClarification } from "@/src/types/assistant";
import en from "@/messages/en.json";

const LABELS: AssistantRecoveryBannerLabels = {
  recoveryLoading:
    "Checking this conversation's recovery status before showing any clarification or draft that may still be pending after the page reload. You are still in the same conversation.",
  transientLostTitle: "The pending clarification for this conversation couldn't be restored after reloading.",
  clarificationRecoveredTitle: "You still have a pending question in this conversation",
  turnRunning: "Your previous message in this conversation is still being processed. Please wait before sending another one.",
  cancel: "Cancel",
  cancelling: "Cancelling",
  terminal: en.assistant.recovery.terminal,
  transfer: en.assistant.clarification.transfer,
};

const CLARIFICATION: AssistantRecoveryClarification = {
  clarificationId: "clar-1",
  entityType: "wallet",
  prompt: 'Which wallet did you mean by "BCA"?',
  options: [{ label: "BCA Tabungan", discriminator: "BANK" }, { label: "BCA Kartu Kredit", discriminator: "CREDIT_CARD" }],
  expiresAt: "2026-07-25T15:30:00.000Z",
};

const meta: Meta<typeof AssistantRecoveryBanner> = {
  title: "Features/Assistant/AssistantRecoveryBanner",
  component: AssistantRecoveryBanner,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssistantRecoveryBanner>;

export const RecoveryLoading: Story = {
  args: { kind: "recoveryLoading", labels: LABELS },
};

export const TransientLost: Story = {
  args: { kind: "transientClarificationLost", labels: LABELS },
};

export const TurnRunning: Story = {
  args: { kind: "turnRunning", labels: LABELS },
};

const onCancelRecovered = fn();

export const ClarificationRecovered: Story = {
  args: {
    kind: "clarificationRecovered",
    clarification: CLARIFICATION,
    isCancelling: false,
    onCancel: onCancelRecovered,
    labels: LABELS,
  },
};

export const ClarificationRecoveredCancelling: Story = {
  args: { ...ClarificationRecovered.args, isCancelling: true },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: ClarificationRecovered.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: ClarificationRecovered.args,
};

export const CancelInteraction: Story = {
  args: ClarificationRecovered.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.cancel }));
    expect(onCancelRecovered).toHaveBeenCalledOnce();
  },
};

/** Phase 38 — a recovered TRANSFER destination question keeps its slot and the chosen source after a refresh. */
export const ClarificationRecoveredTransferDestination: Story = {
  args: {
    ...ClarificationRecovered.args,
    clarification: {
      ...CLARIFICATION,
      prompt: "Dari: GoPay. Ke wallet mana? Pilih salah satu: BCA Tabungan (BANK), BCA Kartu Kredit (CREDIT_CARD).",
      transfer: { field: "DESTINATION_WALLET", sourceWalletLabel: "GoPay" },
    },
  },
};

const onResend = fn();

async function expectNoConfirm(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  expect(canvas.queryByRole("button", { name: /confirm|save transaction/i })).toBeNull();
}

/** Phase 38 terminal recovery — `error.detail: 'EXPIRED'` or `ASSISTANT_CLARIFICATION_EXPIRED`. */
export const TerminalExpired: Story = {
  args: { kind: "terminal", condition: { kind: "expired" }, onResend, isResending: false, labels: LABELS },
  play: async ({ canvasElement }) => {
    await expectNoConfirm(canvasElement);
    await userEvent.click(within(canvasElement).getByRole("button", { name: LABELS.terminal.resend }));
    expect(onResend).toHaveBeenCalledOnce();
  },
};

export const TerminalExpiredResending: Story = {
  args: { ...TerminalExpired.args, isResending: true },
};

/** `error.detail: 'FAILED'` — never auto-retried; the only action is a brand-new draft. */
export const TerminalFailed: Story = {
  args: { kind: "terminal", condition: { kind: "failed" }, onResend: fn(), isResending: false, labels: LABELS },
  play: async ({ canvasElement }) => expectNoConfirm(canvasElement),
};

/** Original instruction isn't on the loaded history page — no resend button, a typed-again hint instead. */
export const TerminalFailedNoOriginalMessage: Story = {
  args: { kind: "terminal", condition: { kind: "failed" }, labels: LABELS },
};

/** `error.detail: 'CANCELLED'`, `ASSISTANT_CLARIFICATION_CANCELLED`, or a CANCELLED latest terminal clarification — information only. */
export const TerminalCancelled: Story = {
  args: { kind: "terminal", condition: { kind: "cancelled" }, labels: LABELS },
  play: async ({ canvasElement }) => {
    await expectNoConfirm(canvasElement);
    expect(within(canvasElement).queryByRole("button")).toBeNull();
  },
};

/** Conversation not ACTIVE (archived) — explains why nothing can continue. */
export const TerminalNotActionableArchived: Story = {
  args: { kind: "terminal", condition: { kind: "notActionable", reason: "archived" }, labels: LABELS },
  play: async ({ canvasElement }) => {
    await expectNoConfirm(canvasElement);
    expect(within(canvasElement).getByText(LABELS.terminal.description.archived)).toBeInTheDocument();
  },
};

export const TerminalNotActionableCommitted: Story = {
  args: { kind: "terminal", condition: { kind: "notActionable", reason: "committed" }, labels: LABELS },
};

export const TerminalNotActionableConsumed: Story = {
  args: { kind: "terminal", condition: { kind: "notActionable", reason: "consumed" }, labels: LABELS },
};

export const TerminalNotActionableStale: Story = {
  args: { kind: "terminal", condition: { kind: "notActionable", reason: "stale" }, labels: LABELS },
};

export const TerminalMobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: TerminalExpired.args,
};

export const TerminalDarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: TerminalFailed.args,
};
