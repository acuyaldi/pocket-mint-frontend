import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const WALLET_TYPES: Record<string, string> = {
  CASH: "Tunai",
  BANK: "Bank",
  E_WALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
};

function ControlledSelect({
  defaultValue,
  disabled,
}: {
  defaultValue?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState<string | null>(defaultValue ?? null);

  return (
    <Select value={value} onValueChange={setValue} items={WALLET_TYPES} disabled={disabled}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Pilih jenis dompet" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(WALLET_TYPES).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const meta = {
  title: "UI/Select",
  component: ControlledSelect,
  parameters: {
    docs: {
      description: {
        component:
          "Shared portaled dropdown built on Base UI, used for wallet type, category, and institution pickers. Requires an `items` map of value → label so the trigger shows a human-readable value instead of a raw id.",
      },
    },
  },
} satisfies Meta<typeof ControlledSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelectedValue: Story = {
  args: {
    defaultValue: "BANK",
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: "CASH",
    disabled: true,
  },
};

export const SelectItemInteraction: Story = {
  name: "Select an item (interaction)",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox"));

    const listbox = await within(document.body).findByRole("listbox");
    await userEvent.click(within(listbox).getByText("E-Wallet"));

    await expect(canvas.getByRole("combobox")).toHaveTextContent("E-Wallet");
  },
};
