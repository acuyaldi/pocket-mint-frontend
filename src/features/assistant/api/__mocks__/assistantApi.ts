import { vi } from "vitest";
import type {
  AssistantConversationStatus,
  AssistantConversationSummary,
  AssistantPage,
  AssistantRecoveryStateResponse,
  AssistantSession,
} from "@/src/types/assistant";
import type { ListAssistantConversationsParams } from "@/src/features/assistant/types";

/**
 * Storybook module mock (see `sb.mock` in AssistantConversationHistory.stories.tsx)
 * for the Assistant conversations API. Archive/restore/delete mutate this
 * in-memory array so a post-mutation refetch reflects the real effect —
 * `__setConversations` reseeds it per story via `beforeEach`, instead of every
 * story sharing one fixture that silently drifts across runs.
 */
let conversations: AssistantConversationSummary[] = [];

export function __setConversations(items: AssistantConversationSummary[]): void {
  conversations = items.map((item) => ({ ...item }));
}

export const listAssistantConversations = vi.fn(
  async (params: ListAssistantConversationsParams = {}): Promise<AssistantPage<AssistantConversationSummary>> => {
    const limit = params.limit ?? 20;
    const page = params.page ?? 1;
    const items = conversations.slice((page - 1) * limit, page * limit);
    return { items, page, limit, total: conversations.length, hasMore: page * limit < conversations.length };
  }
);

export const getAssistantSession = vi.fn(async (): Promise<AssistantSession> => {
  throw new Error("getAssistantSession is not exercised by AssistantConversationHistory stories");
});

export const getAssistantRecoveryState = vi.fn(async (): Promise<AssistantRecoveryStateResponse> => {
  throw new Error("getAssistantRecoveryState is not exercised by AssistantConversationHistory stories");
});

export const archiveAssistantSession = vi.fn(
  async (conversationId: string): Promise<{ id: string; status: AssistantConversationStatus; archivedAt: string | null }> => {
    const item = conversations.find((c) => c.id === conversationId);
    if (item) item.status = "ARCHIVED";
    return { id: conversationId, status: "ARCHIVED", archivedAt: null };
  }
);

export const restoreAssistantSession = vi.fn(
  async (conversationId: string): Promise<{ id: string; status: AssistantConversationStatus; archivedAt: string | null }> => {
    const item = conversations.find((c) => c.id === conversationId);
    if (item) item.status = "ACTIVE";
    return { id: conversationId, status: "ACTIVE", archivedAt: null };
  }
);

export const deleteAssistantSession = vi.fn(async (conversationId: string): Promise<{ id: string }> => {
  conversations = conversations.filter((c) => c.id !== conversationId);
  return { id: conversationId };
});
