import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TelegramConnectionCardView, type TelegramConnectionCardLabels } from "./TelegramConnectionCardView";

const LABELS: TelegramConnectionCardLabels = {
  title: "Telegram",
  subtitle: "Link your Telegram account to message the Assistant directly.",
  loading: "Checking connection status...",
  statusLinked: "Connected to Telegram",
  statusNotLinked: "Not connected yet.",
  generate: "Generate linking code",
  generating: "Generating...",
  instructions: "Open Telegram, message the Pocket Mint bot, and send the command below.",
  copy: "Copy command",
  expiresAt: (time) => `Expires at ${time}`,
  disconnect: "Disconnect",
  disconnectConfirmTitle: "Disconnect Telegram?",
  disconnectConfirmDescription:
    "The Assistant will no longer respond to messages from this Telegram account until you link it again.",
  generateFailed: "Could not generate a linking code. Please try again.",
  cancel: "Cancel",
  deleting: "Deleting",
};

const meta: Meta<typeof TelegramConnectionCardView> = {
  title: "Features/Profile/TelegramConnectionCard",
  component: TelegramConnectionCardView,
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
type Story = StoryObj<typeof TelegramConnectionCardView>;

const BASE = {
  status: "unlinked" as const,
  pendingToken: null,
  copied: false,
  isGenerating: false,
  generateFailed: false,
  confirmingDisconnect: false,
  isRevoking: false,
  labels: LABELS,
  onGenerate: fn(),
  onCopy: fn(),
  onDisconnectRequest: fn(),
  onDisconnectConfirm: fn(),
  onDisconnectCancel: fn(),
} satisfies ComponentProps<typeof TelegramConnectionCardView>;

export const Loading: Story = {
  args: { ...BASE, status: "loading" },
};

export const NotLinked: Story = {
  args: BASE,
};

export const Generating: Story = {
  args: { ...BASE, isGenerating: true },
};

export const PendingLinkCode: Story = {
  args: {
    ...BASE,
    pendingToken: { token: "8fK2n-example-token", expiresAt: "2026-07-26T10:10:00.000Z" },
  },
};

export const PendingLinkCodeCopied: Story = {
  args: {
    ...BASE,
    pendingToken: { token: "8fK2n-example-token", expiresAt: "2026-07-26T10:10:00.000Z" },
    copied: true,
  },
};

export const GenerateFailed: Story = {
  args: { ...BASE, generateFailed: true },
};

export const Linked: Story = {
  args: { ...BASE, status: "linked" },
};

export const DisconnectConfirm: Story = {
  args: { ...BASE, status: "linked", confirmingDisconnect: true },
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: { ...BASE, status: "linked" },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: BASE,
};

export const GenerateInteraction: Story = {
  args: BASE,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.generate }));
    expect(args.onGenerate).toHaveBeenCalledOnce();
  },
};

export const CopyInteraction: Story = {
  args: PendingLinkCode.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.copy }));
    expect(args.onCopy).toHaveBeenCalledOnce();
  },
};

export const DisconnectRequestInteraction: Story = {
  args: { ...BASE, status: "linked" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.disconnect }));
    expect(args.onDisconnectRequest).toHaveBeenCalledOnce();
  },
};
