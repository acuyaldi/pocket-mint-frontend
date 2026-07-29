import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantRecoveryBanner, type AssistantRecoveryBannerLabels } from "./AssistantRecoveryBanner";
import type { AssistantRecoveryClarification } from "@/src/types/assistant";

const LABELS: AssistantRecoveryBannerLabels = {
  recoveryLoading:
    "Checking this conversation's recovery status before showing any clarification or draft that may still be pending after the page reload. You are still in the same conversation.",
  transientLostTitle: "The pending clarification for this conversation couldn't be restored after reloading.",
  clarificationRecoveredTitle: "You still have a pending question in this conversation",
  cancel: "Cancel",
  cancelling: "Cancelling",
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
