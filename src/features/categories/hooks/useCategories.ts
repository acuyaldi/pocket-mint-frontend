"use client";

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: Category[] }>("/categories");
      const categories = response.data?.data ?? [];
      return Array.isArray(categories) ? categories : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
