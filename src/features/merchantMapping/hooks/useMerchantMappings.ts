"use client";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { MerchantMappingDto } from "@/src/types/merchantMapping";

const STALE_TIME = 5 * 60 * 1000;

export const invalidateMerchantMappings = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["merchantMappings"] });
};

export const useMerchantMappings = (search = "") => {
  return useQuery<MerchantMappingDto[], Error>({
    queryKey: ["merchantMappings", search],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: MerchantMappingDto[] }>("/merchant-mappings", {
        params: search ? { search } : undefined,
      });
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export interface CreateMerchantMappingDto {
  merchantName: string;
  categoryId: string;
}

export interface UpdateMerchantMappingDto {
  merchantName?: string;
  categoryId?: string;
}

export const useCreateMerchantMapping = () => {
  const queryClient = useQueryClient();
  return useMutation<MerchantMappingDto, Error, CreateMerchantMappingDto>({
    mutationFn: (dto) =>
      api.post<{ success: boolean; data: MerchantMappingDto }>("/merchant-mappings", dto).then((res) => res.data.data),
    onSuccess: () => invalidateMerchantMappings(queryClient),
  });
};

export const useUpdateMerchantMapping = () => {
  const queryClient = useQueryClient();
  return useMutation<MerchantMappingDto, Error, { id: string } & UpdateMerchantMappingDto>({
    mutationFn: ({ id, ...dto }) =>
      api.patch<{ success: boolean; data: MerchantMappingDto }>(`/merchant-mappings/${id}`, dto).then((res) => res.data.data),
    onSuccess: () => invalidateMerchantMappings(queryClient),
  });
};

export const useDeleteMerchantMapping = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/merchant-mappings/${id}`).then(() => undefined),
    onSuccess: () => invalidateMerchantMappings(queryClient),
  });
};
