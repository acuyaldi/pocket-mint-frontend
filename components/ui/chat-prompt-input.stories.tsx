import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { useState } from "react";

import { ChatPromptInput, type ChatPromptInputProps } from "./chat-prompt-input";

const meta: Meta<typeof ChatPromptInput> = {
  title: "UI/ChatPromptInput",
  component: ChatPromptInput,
  tags: ["autodocs"],
  args: {
    placeholder: "Ketik instruksi... (mis. bayar internet 350 ribu dari BCA)",
    sendLabel: "Kirim",
    onChange: fn(),
    onSend: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatPromptInput>;

/** Interactive wrapper so typing and auto-grow can be exercised in the canvas. */
function Controlled(props: Partial<ChatPromptInputProps>) {
  const [value, setValue] = useState(props.value ?? "");
  return (
    <ChatPromptInput
      placeholder="Ketik instruksi... (mis. bayar internet 350 ribu dari BCA)"
      sendLabel="Kirim"
      onSend={fn()}
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export const Empty: Story = {
  args: { value: "" },
};

export const Filled: Story = {
  args: { value: "bayar internet 350 ribu dari BCA" },
};

export const Sending: Story = {
  args: { ...Filled.args, isSending: true },
};

export const Disabled: Story = {
  args: { ...Filled.args, disabled: true },
};

export const Invalid: Story = {
  args: { ...Filled.args, "aria-invalid": true },
};

export const Interactive: Story = {
  render: () => <Controlled />,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Filled.args,
};

/** The send button is inert while the composer is empty — nothing to send. */
export const EmptyDisablesSend: Story = {
  args: { value: "" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: "Kirim" })).toBeDisabled();
  },
};

export const SendInteraction: Story = {
  args: Filled.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Kirim" }));
    expect(args.onSend).toHaveBeenCalledOnce();
  },
};
