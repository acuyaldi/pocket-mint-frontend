import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { CategorySuggestionList } from "./CategorySuggestionList";
import type { CategorySuggestion } from "../hooks/useCategorySuggestions";

const HIGH_SUGGESTION: CategorySuggestion = {
  categoryId: "cat-belanja",
  categoryName: "Belanja",
  confidence: "HIGH",
  reason: 'Exact match: "indomaret"',
  matchedKeyword: "indomaret",
  normalizedMerchant: "indomaret",
};

const MEDIUM_SUGGESTION: CategorySuggestion = {
  categoryId: "cat-makanan",
  categoryName: "Makanan",
  confidence: "MEDIUM",
  reason: 'Description contains: "makan"',
  matchedKeyword: "makan",
  normalizedMerchant: "makan bakso enak",
};

const LOW_SUGGESTION: CategorySuggestion = {
  categoryId: "cat-transportasi",
  categoryName: "Transportasi",
  confidence: "LOW",
  reason: 'Word matches: "gojek"',
  matchedKeyword: "gojek",
  normalizedMerchant: "naik gojek hari ini",
};

const meta: Meta<typeof CategorySuggestionList> = {
  title: "Features/CategorySuggestionList",
  component: CategorySuggestionList,
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
type Story = StoryObj<typeof CategorySuggestionList>;

export const Empty: Story = {
  args: {
    suggestions: [],
    isLoading: false,
    hasDescription: false,
    onSelect: () => {},
  },
};

export const Loading: Story = {
  args: {
    suggestions: [],
    isLoading: true,
    hasDescription: true,
    onSelect: () => {},
  },
};

export const OneSuggestion: Story = {
  args: {
    suggestions: [HIGH_SUGGESTION],
    isLoading: false,
    hasDescription: true,
    onSelect: () => {},
  },
};

export const MultipleSuggestions: Story = {
  args: {
    suggestions: [HIGH_SUGGESTION, MEDIUM_SUGGESTION, LOW_SUGGESTION],
    isLoading: false,
    hasDescription: true,
    onSelect: () => {},
  },
};

export const LowConfidence: Story = {
  args: {
    suggestions: [LOW_SUGGESTION],
    isLoading: false,
    hasDescription: true,
    onSelect: () => {},
  },
};

export const HighConfidence: Story = {
  args: {
    suggestions: [HIGH_SUGGESTION],
    isLoading: false,
    hasDescription: true,
    onSelect: () => {},
  },
};

export const KeyboardNavigation: Story = {
  args: {
    suggestions: [HIGH_SUGGESTION, MEDIUM_SUGGESTION, LOW_SUGGESTION],
    isLoading: false,
    hasDescription: true,
    onSelect: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const listbox = canvas.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");

    // Arrow down should select first item
    await userEvent.keyboard("{ArrowDown}");
    expect(options[0].getAttribute("aria-selected")).toBe("true");

    // Arrow down again should select second item
    await userEvent.keyboard("{ArrowDown}");
    expect(options[1].getAttribute("aria-selected")).toBe("true");

    // Arrow up should go back to first
    await userEvent.keyboard("{ArrowUp}");
    expect(options[0].getAttribute("aria-selected")).toBe("true");
  },
};

export const DarkMode: Story = {
  parameters: {
    themes: {
      default: "dark",
    },
  },
  args: {
    suggestions: [HIGH_SUGGESTION, MEDIUM_SUGGESTION],
    isLoading: false,
    hasDescription: true,
    onSelect: () => {},
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  args: {
    suggestions: [HIGH_SUGGESTION, MEDIUM_SUGGESTION],
    isLoading: false,
    hasDescription: true,
    onSelect: () => {},
  },
};
