import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { GuidedClarificationCard, type GuidedClarificationCardLabels } from "./GuidedClarificationCard";
import type { GuidedClarification } from "@/src/types/assistant";

const LABELS: GuidedClarificationCardLabels = {
  field: { category: "Category", date: "Date" },
  submit: "Continue",
  cancel: "Cancel",
};

const CLARIFICATION: GuidedClarification = {
  kind: "guided",
  clarificationId: "clar-guided-1",
  fields: [
    { field: "category", required: true, input: { type: "text", placeholder: "e.g. Makan" } },
    { field: "date", required: true, input: { type: "date", max: "2026-10-19" } },
  ],
  expiresAt: "2026-10-19T15:30:00.000Z",
};

const meta: Meta<typeof GuidedClarificationCard> = {
  title: "Features/Assistant/GuidedClarificationCard",
  component: GuidedClarificationCard,
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
type Story = StoryObj<typeof GuidedClarificationCard>;

export const Default: Story = {
  args: {
    clarification: CLARIFICATION,
    prompt: "A few transaction details are missing.",
    labels: LABELS,
    isSubmitting: false,
    isCancelling: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
};

export const DateOnly: Story = {
  args: {
    ...Default.args,
    clarification: { ...CLARIFICATION, fields: [CLARIFICATION.fields[1]!] },
    prompt: "When did this transaction happen?",
  },
};

export const CategoryOnly: Story = {
  args: {
    ...Default.args,
    clarification: { ...CLARIFICATION, fields: [CLARIFICATION.fields[0]!] },
    prompt: "Which category should this go to?",
  },
};

export const Submitting: Story = {
  args: { ...Default.args, isSubmitting: true },
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

export const SubmitInteraction: Story = {
  args: { ...CategoryOnly.args, onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(LABELS.field.category), "Makan");
    await userEvent.click(canvas.getByRole("button", { name: LABELS.submit }));
    expect(args.onSubmit).toHaveBeenCalledWith({ category: "Makan" });
  },
};

export const CancelInteraction: Story = {
  args: { ...Default.args, onCancel: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: LABELS.cancel }));
    expect(args.onCancel).toHaveBeenCalledOnce();
  },
};
