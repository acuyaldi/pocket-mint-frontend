import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ClarificationCard, type ClarificationCardLabels } from "./ClarificationCard";
import type { ClarificationRequest } from "@/src/types/assistant";

const LABELS: ClarificationCardLabels = {
  cancel: "Cancel",
  cancelling: "Cancelling",
};

const CLARIFICATION: ClarificationRequest = {
  clarificationId: "clar-1",
  entityType: "wallet",
  prompt: "Which wallet did you mean by \"BCA\"?",
  options: [
    { token: "tok-1", label: "BCA Tabungan", discriminator: "BANK" },
    { token: "tok-2", label: "BCA Kartu Kredit", discriminator: "CREDIT_CARD" },
  ],
  expiresAt: "2026-07-25T15:30:00.000Z",
};

const meta: Meta<typeof ClarificationCard> = {
  title: "Features/Assistant/ClarificationCard",
  component: ClarificationCard,
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
type Story = StoryObj<typeof ClarificationCard>;

export const Default: Story = {
  args: {
    clarification: CLARIFICATION,
    pendingToken: null,
    isSelecting: false,
    isCancelling: false,
    onSelect: fn(),
    onCancel: fn(),
    labels: LABELS,
  },
};

export const Selecting: Story = {
  args: { ...Default.args, pendingToken: "tok-1", isSelecting: true },
};

export const Cancelling: Story = {
  args: { ...Default.args, isCancelling: true },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: Default.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Default.args,
};

export const CancelInteraction: Story = {
  args: Default.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.cancel }));
    expect(args.onCancel).toHaveBeenCalledOnce();
  },
};
