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
import { FormField } from "./form-field";

const WALLET_TYPES: Record<string, string> = {
  CASH: "Tunai",
  BANK: "Bank",
  E_WALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
};

function ControlledSelect({
  defaultValue,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const [value, setValue] = React.useState<string | null>(defaultValue ?? null);

  return (
    <Select value={value} onValueChange={setValue} items={WALLET_TYPES} disabled={disabled}>
      <SelectTrigger className="w-64" id={id} aria-label={ariaLabel}>
        <SelectValue placeholder="Pilih jenis dompet" />
      </SelectTrigger>
      <SelectContent aria-label={ariaLabel}>
        {Object.entries(WALLET_TYPES).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Real production pattern: FormField clones its `htmlFor` onto the nested SelectTrigger. */
function LabeledSelect(props: { defaultValue?: string; disabled?: boolean; error?: string }) {
  return (
    <FormField label="Jenis Dompet" htmlFor="wallet-type" error={props.error}>
      <ControlledSelect defaultValue={props.defaultValue} disabled={props.disabled} />
    </FormField>
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

export const Default: Story = {
  name: "With visible label",
  render: () => <LabeledSelect />,
};

export const WithSelectedValue: Story = {
  render: () => <LabeledSelect defaultValue="BANK" />,
};

export const WithoutVisibleLabel: Story = {
  name: "Without visible label (aria-label)",
  args: {
    "aria-label": "Jenis Dompet",
  },
};

export const Disabled: Story = {
  render: () => <LabeledSelect defaultValue="CASH" disabled />,
};

export const ValidationError: Story = {
  name: "Validation error",
  render: () => <LabeledSelect error="Jenis dompet wajib dipilih." />,
};

export const SelectItemInteraction: Story = {
  name: "Select an item (interaction)",
  args: {
    "aria-label": "Jenis Dompet",
  },
  parameters: {
    a11y: {
      options: {
        rules: {
          // Base UI's FloatingFocusManager renders visually-hidden,
          // tabIndex=0 "focus guard" spans (aria-hidden + focusable by
          // design) to redirect Tab navigation around the open popup — the
          // same technique used by Radix/Floating UI. It only exists while
          // the popup is open, so it only shows up here. Not our markup;
          // there's no public Base UI prop to opt out of it.
          "aria-hidden-focus": { enabled: false },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox"));

    const listbox = await within(document.body).findByRole("listbox");
    await userEvent.click(within(listbox).getByText("E-Wallet"));

    await expect(canvas.getByRole("combobox")).toHaveTextContent("E-Wallet");
  },
};
