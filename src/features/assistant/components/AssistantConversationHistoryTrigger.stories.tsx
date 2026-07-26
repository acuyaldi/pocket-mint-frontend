import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantConversationHistoryTrigger } from "./AssistantConversationHistoryTrigger";

const meta: Meta<typeof AssistantConversationHistoryTrigger> = {
  title: "Features/Assistant/AssistantConversationHistoryTrigger",
  component: AssistantConversationHistoryTrigger,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssistantConversationHistoryTrigger>;

export const Default: Story = {
  args: {
    label: "Open conversation history",
    onClick: fn(),
  },
};

export const ClickInteraction: Story = {
  args: Default.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open conversation history" }));
    expect(args.onClick).toHaveBeenCalled();
  },
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Default.args,
};
