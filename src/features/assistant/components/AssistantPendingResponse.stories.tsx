import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AssistantPendingResponse } from "./AssistantPendingResponse";

const meta: Meta<typeof AssistantPendingResponse> = {
  title: "Features/Assistant/AssistantPendingResponse",
  component: AssistantPendingResponse,
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
type Story = StoryObj<typeof AssistantPendingResponse>;

export const Default: Story = {
  args: { label: "Waiting for the assistant's response..." },
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Default.args,
};
