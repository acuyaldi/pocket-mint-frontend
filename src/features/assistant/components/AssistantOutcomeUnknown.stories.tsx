import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantOutcomeUnknown, type AssistantOutcomeUnknownLabels } from "./AssistantOutcomeUnknown";

const LABELS: AssistantOutcomeUnknownLabels = {
  heading: "We couldn't confirm what happened",
  description:
    "Your previous action may or may not have gone through. Check the conversation to see the real outcome, or try again if it's safe to do so.",
  check: "Check conversation",
  checking: "Checking",
  retry: "Try again",
  retrying: "Trying again",
};

const meta: Meta<typeof AssistantOutcomeUnknown> = {
  title: "Features/Assistant/AssistantOutcomeUnknown",
  component: AssistantOutcomeUnknown,
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
type Story = StoryObj<typeof AssistantOutcomeUnknown>;

export const WithRetry: Story = {
  args: {
    onCheck: fn(),
    onRetry: fn(),
    isChecking: false,
    isRetrying: false,
    labels: LABELS,
  },
};

export const WithoutRetry: Story = {
  args: {
    onCheck: fn(),
    onRetry: undefined,
    isChecking: false,
    isRetrying: false,
    labels: LABELS,
  },
};

export const Checking: Story = {
  args: { ...WithRetry.args, isChecking: true },
};

export const Retrying: Story = {
  args: { ...WithRetry.args, isRetrying: true },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: WithRetry.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: WithRetry.args,
};

export const CheckInteraction: Story = {
  args: WithRetry.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.check }));
    expect(args.onCheck).toHaveBeenCalledOnce();
  },
};
