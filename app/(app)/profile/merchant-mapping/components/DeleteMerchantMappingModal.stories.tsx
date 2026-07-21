import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DeleteMerchantMappingModal } from "./DeleteMerchantMappingModal";
import type { MerchantMappingDto } from "@/src/types/merchantMapping";

const MAPPING: MerchantMappingDto = {
  id: "mapping-1",
  merchantName: "Warung Bu Siti",
  normalizedMerchant: "warung bu siti",
  categoryId: "cat-makanan",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const meta: Meta<typeof DeleteMerchantMappingModal> = {
  title: "Features/DeleteMerchantMappingModal",
  component: DeleteMerchantMappingModal,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DeleteMerchantMappingModal>;

export const DeleteConfirmation: Story = {
  args: {
    mapping: MAPPING,
    isDeleting: false,
    onClose: () => {},
    onConfirm: () => {},
  },
};

export const Deleting: Story = {
  args: {
    mapping: MAPPING,
    isDeleting: true,
    onClose: () => {},
    onConfirm: () => {},
  },
};

export const Closed: Story = {
  args: {
    mapping: null,
    isDeleting: false,
    onClose: () => {},
    onConfirm: () => {},
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
    isDeleting: false,
    onClose: () => {},
    onConfirm: () => {},
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
    isDeleting: false,
    onClose: () => {},
    onConfirm: () => {},
  },
};
