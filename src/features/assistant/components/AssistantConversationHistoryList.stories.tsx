import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { AssistantConversationHistoryList, type AssistantConversationHistoryLabels } from "./AssistantConversationHistoryList";
import type { AssistantConversationSummary } from "@/src/types/assistant";

const LABELS: AssistantConversationHistoryLabels = {
  listLabel: "Previous conversations",
  loading: "Loading conversations...",
  error: "Couldn't load conversation history.",
  retry: "Retry",
  empty: "No previous conversations yet.",
  loadMore: "Load more",
  loadingMore: "Loading more",
  activeConversationLabel: "active",
  archivedStatus: "Archived",
  searchLoaded: "Search loaded conversations",
  searchPlaceholder: "Search previews already loaded",
  filterAll: "All",
  filterActive: "Active",
  filterArchived: "Archived",
  showingLoaded: "Loaded 3 of 103 conversations",
  noSearchResults: "No loaded conversations match this search.",
  selectConversation: "Select conversation",
  selectAllLoaded: "Select all loaded active conversations",
  clearSelection: "Clear selection",
  archive: "Archive",
  archiving: "Archiving",
  conversationFromDate: (date: string) => `Conversation from ${date}`,
};

const ITEMS: AssistantConversationSummary[] = [
  {
    id: "conv-1",
    status: "ACTIVE",
    locale: "id",
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-25T09:12:00.000Z",
    lastActivityAt: "2026-07-25T09:12:00.000Z",
    lastMessage: "Catat pengeluaran 350 ribu untuk internet dari BCA.",
  },
  {
    id: "conv-2",
    status: "ACTIVE",
    locale: "id",
    createdAt: "2026-07-18T08:00:00.000Z",
    updatedAt: "2026-07-19T10:00:00.000Z",
    lastActivityAt: "2026-07-19T10:00:00.000Z",
  },
  {
    id: "conv-3",
    status: "ARCHIVED",
    locale: "id",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-02T08:00:00.000Z",
    lastActivityAt: "2026-07-02T08:00:00.000Z",
    lastMessage: "Gaji bulan ini masuk ke BCA delapan juta rupiah, terima kasih sudah dicatat dengan rapi.",
  },
];

const meta: Meta<typeof AssistantConversationHistoryList> = {
  title: "Features/Assistant/AssistantConversationHistoryList",
  component: AssistantConversationHistoryList,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssistantConversationHistoryList>;

export const Populated: Story = {
  args: {
    items: ITEMS,
    loadedCount: ITEMS.length,
    filteredCount: ITEMS.length,
    isLoading: false,
    isError: false,
    onRetry: fn(),
    selectedId: "conv-1",
    selectedIds: new Set(["conv-1"]),
    onSelect: fn(),
    onToggleSelect: fn(),
    onSelectAllLoaded: fn(),
    onClearSelection: fn(),
    onArchive: fn(),
    hasMore: false,
    isLoadingMore: false,
    onLoadMore: fn(),
    intlLocale: "id-ID",
    labels: LABELS,
  },
};

export const Empty: Story = {
  args: { ...Populated.args, items: [], loadedCount: 0, filteredCount: 0 },
};

export const NoSearchResults: Story = {
  args: { ...Populated.args, items: [], loadedCount: ITEMS.length, filteredCount: 0 },
};

export const Loading: Story = {
  args: { ...Populated.args, isLoading: true },
};

export const ErrorState: Story = {
  args: { ...Populated.args, isError: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.retry }));
    expect(args.onRetry).toHaveBeenCalled();
  },
};

export const LoadMore: Story = {
  args: { ...Populated.args, hasMore: true },
};

export const LoadingMore: Story = {
  args: { ...Populated.args, hasMore: true, isLoadingMore: true },
};

export const SelectInteraction: Story = {
  args: Populated.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText(/Gaji bulan ini/));
    expect(args.onSelect).toHaveBeenCalledWith("conv-3");
  },
};

export const ArchiveInteraction: Story = {
  args: Populated.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("button", { name: /Archive:/ })[0]);
    expect(args.onArchive).toHaveBeenCalledWith(ITEMS[0]);
  },
};

export const PaginatedHundredPlus: Story = {
  args: { ...Populated.args, loadedCount: 20, filteredCount: 20, hasMore: true },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: Populated.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Populated.args,
};
