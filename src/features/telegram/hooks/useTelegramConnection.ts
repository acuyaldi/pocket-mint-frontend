"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { TelegramConnectionDto, TelegramLinkTokenDto } from "@/src/types/telegram";

const CONNECTION_QUERY_KEY = ["telegramConnection"];

export const useTelegramConnection = () => {
  return useQuery<TelegramConnectionDto, Error>({
    queryKey: CONNECTION_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: TelegramConnectionDto }>("/channels/telegram/connection");
      return response.data.data;
    },
  });
};

export const useCreateTelegramLinkToken = () => {
  return useMutation<TelegramLinkTokenDto, Error, void>({
    mutationFn: () =>
      api.post<{ success: boolean; data: TelegramLinkTokenDto }>("/channels/telegram/link-token").then((res) => res.data.data),
  });
};

export const useRevokeTelegramConnection = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => api.post("/channels/telegram/revoke").then(() => undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEY }),
  });
};
