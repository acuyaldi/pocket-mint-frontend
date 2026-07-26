/** TanStack Query key factory for the Assistant feature — same array-literal convention as other features (see `useBudgets.ts`). */
export const assistantKeys = {
  conversations: (page?: number, limit?: number) => ["assistant", "conversations", page, limit] as const,
  session: (conversationId: string) => ["assistant", "conversations", "detail", conversationId] as const,
  recoveryState: (conversationId: string) =>
    ["assistant", "conversations", "detail", conversationId, "recovery-state"] as const,
};
