import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { DraftActionBar, type DraftActionBarLabels } from "./DraftActionBar";

const LABELS: DraftActionBarLabels = {
  confirm: "Confirm",
  confirming: "Confirming",
  cancel: "Cancel",
  cancelling: "Cancelling",
};

const meta: Meta<typeof DraftActionBar> = {
  title: "Features/Assistant/DraftActionBar",
  component: DraftActionBar,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DraftActionBar>;

export const Default: Story = {
  args: {
    labels: LABELS,
    onConfirm: fn(),
    onCancel: fn(),
    isConfirming: false,
    isCancelling: false,
  },
};

export const Confirming: Story = {
  args: { ...Default.args, isConfirming: true },
};

export const Cancelling: Story = {
  args: { ...Default.args, isCancelling: true },
};

export const Disabled: Story = {
  args: { ...Default.args, disabled: true },
};

export const ConfirmInteraction: Story = {
  args: Default.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.confirm }));
    expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};

export const CancelInteraction: Story = {
  args: Default.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.cancel }));
    expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Default.args,
};
