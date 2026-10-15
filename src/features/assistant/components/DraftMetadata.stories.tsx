import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DraftMetadata } from "./DraftMetadata";

const meta: Meta<typeof DraftMetadata> = {
  title: "Features/Assistant/DraftMetadata",
  component: DraftMetadata,
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
type Story = StoryObj<typeof DraftMetadata>;

export const Filled: Story = {
  args: {
    items: [
      { label: "Wallet", value: "BCA" },
      { label: "Category", value: "Makanan" },
      { label: "Merchant", value: "Indomaret" },
      { label: "Date", value: "25 Juli 2026" },
    ],
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Filled.args,
};
