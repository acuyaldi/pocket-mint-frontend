"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: ConfidenceLevel;
  reason: string;
  matchedKeyword: string;
  normalizedMerchant: string;
}

interface SuggestionsResponse {
  status: string;
  data: CategorySuggestion[];
}

/**
 * Fetch category suggestions for a transaction description.
 *
 * Debounce externally (caller controls when to request). Returns empty
 * when the description is too short (< 3 chars after trim).
 *
 * Suggestions disappear when input no longer matches — the query
 * key includes the description, so changing it fetches new results
 * and old results are discarded by React Query.
 */
export function useCategorySuggestions(
  description: string,
  type: "EXPENSE" | "INCOME",
) {
  const trimmed = description.trim();
  const enabled = trimmed.length >= 3;

  return useQuery<CategorySuggestion[]>({
    queryKey: ["categorySuggestions", trimmed, type],
    queryFn: async () => {
      const response = await api.get<SuggestionsResponse>(
        "/categories/suggestions",
        { params: { description: trimmed, type } },
      );
      return response.data?.data ?? [];
    },
    enabled,
    staleTime: 30_000, // 30s — suggestions are deterministic for the same input
    gcTime: 60_000,
  });
}
