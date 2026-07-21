import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormField, FormErrorMessage } from "./form-field";
import { Input } from "./input";

const meta = {
  title: "UI/FormField",
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          "Standard label + control + helper/error wrapper used by every modal field (wallet, transaction, installment forms). Clones `id` and `aria-*` onto the child control automatically.",
      },
    },
  },
  args: {
    label: "Nama Dompet",
    htmlFor: "wallet-name",
    children: <Input placeholder="cth. BCA Tabungan" />,
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const WithDescription: Story = {
  args: {
    description: "Nama ini akan tampil di daftar dompet dan riwayat transaksi.",
  },
};

export const ValidationError: Story = {
  name: "Validation error",
  args: {
    error: "Nama dompet wajib diisi.",
    children: <Input placeholder="cth. BCA Tabungan" aria-invalid />,
  },
};

export const FormLevelError: Story = {
  name: "Form-level error banner",
  render: () => (
    <FormErrorMessage message="Gagal menyimpan dompet. Silakan coba lagi." />
  ),
};
