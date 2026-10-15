import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AssistantConversationEmptyState } from "./AssistantConversationEmptyState";

const meta: Meta<typeof AssistantConversationEmptyState> = {
  title: "Features/Assistant/AssistantConversationEmptyState",
  component: AssistantConversationEmptyState,
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
type Story = StoryObj<typeof AssistantConversationEmptyState>;

export const Default: Story = {
  args: {
    title: "Start a new conversation",
    description: "Describe one income or expense in your own words and Pocket Mint Assistant will help you record it.",
    examplesLabel: "Examples",
    examples: ["bayar internet 350 ribu dari BCA", "gaji bulan ini masuk ke BCA 8 juta"],
  },
};

export const NoExamples: Story = {
  args: { ...Default.args, examples: [] },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: Default.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Default.args,
};
