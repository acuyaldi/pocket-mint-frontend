import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MerchantMappingRow } from "./MerchantMappingRow";
import type { MerchantMappingDto } from "@/src/types/merchantMapping";

const MAPPING: MerchantMappingDto = {
  id: "mapping-1",
  merchantName: "Warung Bu Siti",
  normalizedMerchant: "warung bu siti",
  categoryId: "cat-makanan",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const meta: Meta<typeof MerchantMappingRow> = {
  title: "Features/MerchantMappingRow",
  component: MerchantMappingRow,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ul className="max-w-md space-y-3 p-4">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MerchantMappingRow>;

export const Populated: Story = {
  args: {
    mapping: MAPPING,
    categoryName: "Makanan",
    editLabel: "Ubah",
    deleteLabel: "Hapus",
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const LongMerchantName: Story = {
  args: {
    mapping: {
      ...MAPPING,
      merchantName: "Toko Kelontong Pak Budi Jaya Sentosa Abadi Sejahtera",
    },
    categoryName: "Belanja",
    editLabel: "Ubah",
    deleteLabel: "Hapus",
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const DarkMode: Story = {
  parameters: {
    themes: {
      default: "dark",
    },
  },
  args: {
    mapping: MAPPING,
    categoryName: "Makanan",
    editLabel: "Ubah",
    deleteLabel: "Hapus",
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  args: {
    mapping: MAPPING,
    categoryName: "Makanan",
    editLabel: "Ubah",
    deleteLabel: "Hapus",
    onEdit: () => {},
    onDelete: () => {},
  },
};
