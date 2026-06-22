"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/api/queryKeys";
import type { Shortlist, ShortlistCount } from "@/lib/api/types";

export function useShortlistQuery(opts: { enabled?: boolean } = {}) {
  return useQuery<Shortlist[]>({
    queryKey: queryKeys.shortlist,
    enabled: opts.enabled ?? true,
  });
}

export function useShortlistCountQuery(opts: { enabled?: boolean } = {}) {
  return useQuery<ShortlistCount>({
    queryKey: queryKeys.shortlistCount,
    enabled: opts.enabled ?? true,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.shortlist });
  qc.invalidateQueries({ queryKey: queryKeys.shortlistCount });
}

export function useAddToShortlist() {
  const qc = useQueryClient();
  return useMutation<Shortlist, ApiError, string>({
    mutationFn: (developerId) =>
      apiFetch<Shortlist>(`shortlist/${developerId}`, { method: "POST" }),
    onSuccess: () => invalidate(qc),
  });
}

export function useRemoveFromShortlist() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (developerId) => {
      await apiFetch(`shortlist/${developerId}`, { method: "DELETE" });
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useClearShortlist() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await apiFetch("shortlist", { method: "DELETE" });
    },
    onSuccess: () => invalidate(qc),
  });
}
