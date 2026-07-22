"use client";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { RuleDto, RuleMatchType, RuleOperator } from "@/src/types/rule";

const STALE_TIME = 5 * 60 * 1000;

export const invalidateRules = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["rules"] });
};

export const useRules = () => {
  return useQuery<RuleDto[], Error>({
    queryKey: ["rules"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: RuleDto[] }>("/rules");
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export interface CreateRuleDto {
  name: string;
  matchType: RuleMatchType;
  operator: RuleOperator;
  value: string;
  categoryId: string;
  enabled?: boolean;
}

export interface UpdateRuleDto {
  name?: string;
  matchType?: RuleMatchType;
  operator?: RuleOperator;
  value?: string;
  categoryId?: string;
  enabled?: boolean;
}

export const useCreateRule = () => {
  const queryClient = useQueryClient();
  return useMutation<RuleDto, Error, CreateRuleDto>({
    mutationFn: (dto) => api.post<{ success: boolean; data: RuleDto }>("/rules", dto).then((res) => res.data.data),
    onSuccess: () => invalidateRules(queryClient),
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  return useMutation<RuleDto, Error, { id: string } & UpdateRuleDto>({
    mutationFn: ({ id, ...dto }) =>
      api.patch<{ success: boolean; data: RuleDto }>(`/rules/${id}`, dto).then((res) => res.data.data),
    onSuccess: () => invalidateRules(queryClient),
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/rules/${id}`).then(() => undefined),
    onSuccess: () => invalidateRules(queryClient),
  });
};

/** Persists a full reordering. Optimistically updates the cached list so drag/move feels instant. */
export const useReorderRules = () => {
  const queryClient = useQueryClient();
  return useMutation<RuleDto[], Error, string[]>({
    mutationFn: (ruleIds) =>
      api.patch<{ success: boolean; data: RuleDto[] }>("/rules/reorder", { ruleIds }).then((res) => res.data.data),
    onMutate: async (ruleIds) => {
      await queryClient.cancelQueries({ queryKey: ["rules"] });
      const previous = queryClient.getQueryData<RuleDto[]>(["rules"]);
      if (previous) {
        const byId = new Map(previous.map((r) => [r.id, r]));
        const reordered = ruleIds
          .map((id, index) => {
            const rule = byId.get(id);
            return rule ? { ...rule, priority: index } : null;
          })
          .filter((r): r is RuleDto => r !== null);
        queryClient.setQueryData(["rules"], reordered);
      }
      return { previous };
    },
    onError: (_err, _ruleIds, context) => {
      const ctx = context as { previous?: RuleDto[] } | undefined;
      if (ctx?.previous) queryClient.setQueryData(["rules"], ctx.previous);
    },
    onSuccess: () => invalidateRules(queryClient),
  });
};
