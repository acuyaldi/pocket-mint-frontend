import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AssistantMessage, type AssistantMessageLabels } from "./AssistantMessage";

const LABELS: AssistantMessageLabels = {
  USER: "You",
  ASSISTANT: "Assistant",
  SYSTEM: "System",
  telegramChannel: "Sent from Telegram",
  deliveryDelivering: "Delivering to Telegram",
  deliverySent: "Delivered to Telegram",
  deliveryFailed: "Delivery to Telegram failed",
};

const meta: Meta<typeof AssistantMessage> = {
  title: "Features/Assistant/AssistantMessage",
  component: AssistantMessage,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ul className="max-w-xl space-y-4 p-4">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssistantMessage>;

export const User: Story = {
  args: { message: { role: "USER", content: "bayar internet 350 ribu dari BCA" }, labels: LABELS },
};

export const Assistant: Story = {
  args: {
    message: { role: "ASSISTANT", content: "Rp350.000 expense at Internet from BCA, categorized as Tagihan." },
    labels: LABELS,
  },
};

export const LongContent: Story = {
  args: {
    message: {
      role: "ASSISTANT",
      content:
        "Saya mencatat pengeluaran Rp350.000 untuk tagihan internet bulan ini dari dompet BCA Tabungan, dengan kategori Tagihan dan catatan pembayaran rutin bulanan yang cukup panjang untuk menguji pembungkusan teks.",
    },
    labels: LABELS,
  },
};

export const FromTelegram: Story = {
  args: {
    message: { role: "USER", content: "bayar internet 350 ribu dari BCA" },
    labels: LABELS,
    channel: "TELEGRAM",
  },
};

export const TelegramDelivering: Story = {
  args: {
    message: { role: "ASSISTANT", content: "Rp350.000 expense at Internet from BCA, categorized as Tagihan." },
    labels: LABELS,
    channel: "TELEGRAM",
    deliveryStatus: "PROCESSING",
  },
};

export const TelegramDelivered: Story = {
  args: {
    message: { role: "ASSISTANT", content: "Rp350.000 expense at Internet from BCA, categorized as Tagihan." },
    labels: LABELS,
    channel: "TELEGRAM",
    deliveryStatus: "DELIVERED",
  },
};

export const TelegramDeliveryFailed: Story = {
  args: {
    message: { role: "ASSISTANT", content: "Rp350.000 expense at Internet from BCA, categorized as Tagihan." },
    labels: LABELS,
    channel: "TELEGRAM",
    deliveryStatus: "FAILED",
  },
};

/** Phase 32 — a retention-purged Telegram delivery reads `UNKNOWN`, which must render exactly like `TelegramDelivering`'s absent case did before Phase 31: nothing, never a failure icon. This story documents that intent, not a visual difference from `Assistant`. */
export const TelegramHistoricalUnknown: Story = {
  args: {
    message: { role: "ASSISTANT", content: "Rp350.000 expense at Internet from BCA, categorized as Tagihan." },
    labels: LABELS,
    channel: "TELEGRAM",
    deliveryStatus: "UNKNOWN",
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: Assistant.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Assistant.args,
};
