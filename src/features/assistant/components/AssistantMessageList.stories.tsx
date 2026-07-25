import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AssistantMessageList } from "./AssistantMessageList";
import type { AssistantMessageLabels } from "./AssistantMessage";
import type { AssistantMessage } from "@/src/types/assistant";

const MESSAGE_LABELS: AssistantMessageLabels = { USER: "You", ASSISTANT: "Assistant", SYSTEM: "System" };

const MESSAGES: AssistantMessage[] = [
  { id: "msg-1", turnId: "turn-1", role: "USER", source: "USER_PROVIDED", content: "bayar internet 350 ribu dari BCA", createdAt: "2026-07-25T10:00:00.000Z" },
  {
    id: "msg-2",
    turnId: "turn-1",
    role: "ASSISTANT",
    source: "DETERMINISTIC_RENDERER",
    content: "Rp350.000 expense at Internet from BCA, categorized as Tagihan.",
    createdAt: "2026-07-25T10:00:01.000Z",
  },
];

const meta: Meta<typeof AssistantMessageList> = {
  title: "Features/Assistant/AssistantMessageList",
  component: AssistantMessageList,
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
type Story = StoryObj<typeof AssistantMessageList>;

const BASE = {
  isLoading: false,
  errorMessage: null,
  loadingLabel: "Loading conversation...",
  errorRetryLabel: "Retry",
  onRetry: fn(),
  messageLabels: MESSAGE_LABELS,
  listLabel: "Conversation messages",
};

export const Conversation: Story = {
  args: { ...BASE, messages: MESSAGES },
};

export const Empty: Story = {
  args: { ...BASE, messages: [] },
};

export const Loading: Story = {
  args: { ...BASE, messages: [], isLoading: true },
};

export const RetrievalError: Story = {
  args: { ...BASE, messages: [], errorMessage: "Couldn't load this conversation. Please try again." },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: Conversation.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Conversation.args,
};
