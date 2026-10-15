import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantResultState } from "./AssistantResultState";

const meta: Meta<typeof AssistantResultState> = {
  title: "Features/Assistant/AssistantResultState",
  component: AssistantResultState,
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
type Story = StoryObj<typeof AssistantResultState>;

export const DraftConfirmed: Story = {
  args: {
    renderedText: "Rp50.000 expense at Indomaret from BCA confirmed.",
    actionLabel: "New instruction",
    onAction: fn(),
  },
};

export const Advisory: Story = {
  args: {
    renderedText: "Your BCA balance is Rp2.450.000.",
    actionLabel: "New instruction",
    onAction: fn(),
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: DraftConfirmed.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: DraftConfirmed.args,
};

export const ActionInteraction: Story = {
  args: DraftConfirmed.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New instruction" }));
    expect(args.onAction).toHaveBeenCalledOnce();
  },
};
