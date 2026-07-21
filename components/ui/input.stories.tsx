import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          "Shared text input used inside `FormField` throughout wallet, transaction, and installment forms.",
      },
    },
  },
  args: {
    placeholder: "Masukkan nilai",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "Gaji Bulanan",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Tidak dapat diubah",
  },
};

export const ValidationError: Story = {
  name: "Validation error",
  args: {
    "aria-invalid": true,
    defaultValue: "abc",
  },
};

export const LongText: Story = {
  args: {
    defaultValue:
      "Pembayaran cicilan kartu kredit untuk pembelian laptop kerja bulan ini",
  },
};

export const Numeric: Story = {
  args: {
    type: "number",
    placeholder: "0",
  },
};
