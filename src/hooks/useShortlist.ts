"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useAddToShortlist,
  useClearShortlist,
  useRemoveFromShortlist,
  useShortlistCountQuery,
  useShortlistQuery,
} from "@/lib/api/hooks/useShortlistApi";
import {
  addToLocalShortlist,
  clearLocalShortlist,
  getLocalShortlist,
  removeFromLocalShortlist,
} from "@/lib/utils/localShortlist";

import { useUser } from "./useUser";

export function useShortlist() {
  const { isGuest, isLoading: userLoading } = useUser();
  const isLocalMode = isGuest;

  const [localShortlistIds, setLocalShortlistIds] = useState<string[]>([]);

  useEffect(() => {
    // Hydrate guest shortlist from localStorage on the client only. SSR
    // can't read localStorage, so we defer to an effect — intentional
    // setState-in-effect, exactly the "external system → React state"
    // pattern the rule's docs say is fine.
    if (isLocalMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalShortlistIds(getLocalShortlist());
    }
  }, [isLocalMode]);

  const shortlistQuery = useShortlistQuery({ enabled: !isLocalMode && !userLoading });
  const countQuery = useShortlistCountQuery({ enabled: !isLocalMode && !userLoading });

  const addMutation = useAddToShortlist();
  const removeMutation = useRemoveFromShortlist();
  const clearMutation = useClearShortlist();

  // Stable reference for the `useCallback` deps below — without useMemo,
  // the ``?? []`` fallback synthesizes a new empty array every render and
  // invalidates the callback's memo.
  const apiShortlist = useMemo(
    () => shortlistQuery.data ?? [],
    [shortlistQuery.data],
  );
  const apiShortlistCount = countQuery.data?.count ?? 0;

  const shortlistCount = isLocalMode ? localShortlistIds.length : apiShortlistCount;

  const isInShortlist = useCallback(
    (developerId: string) => {
      if (isLocalMode) return localShortlistIds.includes(developerId);
      return apiShortlist.some((entry) => entry.developer.id === developerId);
    },
    [isLocalMode, localShortlistIds, apiShortlist],
  );

  const addToShortlist = useCallback(
    async (developerId: string) => {
      if (isLocalMode) {
        const success = addToLocalShortlist(developerId);
        if (success) setLocalShortlistIds(getLocalShortlist());
        return success;
      }
      try {
        await addMutation.mutateAsync(developerId);
        return true;
      } catch {
        return false;
      }
    },
    [isLocalMode, addMutation],
  );

  const removeFromShortlist = useCallback(
    async (developerId: string) => {
      if (isLocalMode) {
        removeFromLocalShortlist(developerId);
        setLocalShortlistIds(getLocalShortlist());
        return true;
      }
      try {
        await removeMutation.mutateAsync(developerId);
        return true;
      } catch {
        return false;
      }
    },
    [isLocalMode, removeMutation],
  );

  const toggleShortlist = useCallback(
    async (developerId: string) =>
      isInShortlist(developerId) ? removeFromShortlist(developerId) : addToShortlist(developerId),
    [isInShortlist, addToShortlist, removeFromShortlist],
  );

  const clearShortlistAction = useCallback(async () => {
    if (isLocalMode) {
      clearLocalShortlist();
      setLocalShortlistIds([]);
      return true;
    }
    try {
      await clearMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [isLocalMode, clearMutation]);

  const shortlistIds = isLocalMode
    ? localShortlistIds
    : apiShortlist.map((entry) => entry.developer.id);

  return {
    shortlistIds,
    shortlistCount,
    shortlistLoading: isLocalMode ? false : shortlistQuery.isLoading || userLoading,
    isInShortlist,
    addToShortlist,
    removeFromShortlist,
    toggleShortlist,
    clearShortlist: clearShortlistAction,
    isLoading: addMutation.isPending || removeMutation.isPending || clearMutation.isPending,
    isLocalMode,
  };
}
