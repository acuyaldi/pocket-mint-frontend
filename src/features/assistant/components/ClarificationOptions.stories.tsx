import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ClarificationOptions } from "./ClarificationOptions";
import type { ClarificationOption } from "@/src/types/assistant";

const OPTIONS: ClarificationOption[] = [
  { token: "tok-1", label: "BCA", discriminator: "BANK" },
  { token: "tok-2", label: "Cash", discriminator: "CASH" },
  { token: "tok-3", label: "GoPay", discriminator: "E_WALLET" },
];

const meta: Meta<typeof ClarificationOptions> = {
  title: "Features/Assistant/ClarificationOptions",
  component: ClarificationOptions,
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
type Story = StoryObj<typeof ClarificationOptions>;

export const Default: Story = {
  args: {
    entityType: "wallet",
    options: OPTIONS,
    pendingToken: null,
    disabled: false,
    onSelect: fn(),
  },
};

export const CategoryChips: Story = {
  args: {
    ...Default.args,
    entityType: "category",
    options: [
      { token: "tok-1", label: "Internet", discriminator: "EXPENSE" },
      { token: "tok-2", label: "Tagihan", discriminator: "EXPENSE" },
      { token: "tok-3", label: "Makanan", discriminator: "EXPENSE" },
    ],
  },
};

export const MerchantChips: Story = {
  args: {
    ...Default.args,
    entityType: "merchant",
    options: [
      { token: "tok-1", label: "Starbucks" },
      { token: "tok-2", label: "Starbucks Reserve" },
    ],
  },
};

export const Pending: Story = {
  args: { ...Default.args, pendingToken: "tok-2", disabled: true },
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Default.args,
};

export const SelectInteraction: Story = {
  args: Default.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Cash/ }));
    expect(args.onSelect).toHaveBeenCalledWith("tok-2");
  },
};
