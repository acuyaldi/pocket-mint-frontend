import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantCommandForm, type AssistantCommandFormLabels } from "./AssistantCommandForm";

const LABELS: AssistantCommandFormLabels = {
  label: "What would you like to record?",
  placeholder: "e.g. bayar internet 350 ribu dari BCA",
  helper: "Describe one income or expense in your own words.",
  submit: "Send",
  submitting: "Sending",
};

const meta: Meta<typeof AssistantCommandForm> = {
  title: "Features/Assistant/AssistantCommandForm",
  component: AssistantCommandForm,
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
type Story = StoryObj<typeof AssistantCommandForm>;

export const Empty: Story = {
  args: {
    value: "",
    onChange: fn(),
    onSubmit: fn(),
    isSubmitting: false,
    labels: LABELS,
  },
};

export const Filled: Story = {
  args: { ...Empty.args, value: "bayar internet 350 ribu dari BCA" },
};

export const Submitting: Story = {
  args: { ...Filled.args, isSubmitting: true },
};

/**
 * Inline errors are reserved for genuine field validation (e.g. an over-length
 * instruction). Global request/provider/network failures are shown via the top
 * snackbar, never here — so the input is only ever marked invalid for real
 * input validation.
 */
export const WithValidationError: Story = {
  args: { ...Filled.args, error: "That instruction is too long. Please shorten it." },
};

export const DisabledForClarification: Story = {
  args: { ...Empty.args, disabledReason: "Answer the clarification above before sending a new instruction." },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: Filled.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Filled.args,
};

export const SubmitInteraction: Story = {
  args: Filled.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.submit }));
    expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};
