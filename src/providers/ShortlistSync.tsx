"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/api/queryKeys";
import type { Shortlist } from "@/lib/api/types";
import { useMe } from "@/lib/api/hooks/useMe";
import {
  clearLocalShortlist,
  getLocalShortlist,
  getMergeAdditions,
} from "@/lib/utils/localShortlist";

interface ShortlistSyncProps {
  children: React.ReactNode;
}

const VERIFICATION_TOAST_SHOWN_KEY = "devmatch_verification_toast_shown";

export function ShortlistSync({ children }: ShortlistSyncProps) {
  const { isAuthenticated, isLoading: auth0Loading, user: auth0User, logout } = useAuth0();
  const me = useMe();
  const qc = useQueryClient();
  const hasSyncedShortlist = useRef(false);
  const prevAuthenticated = useRef(false);

  // A user who is Auth0-authenticated but has no DB row yet is sitting on
  // /welcome picking a role. Skip shortlist sync until the row exists —
  // otherwise we'd hit 403 complete_signup_required and toast a confusing error.
  const hasUserRow = !!me.user;

  const syncLocalShortlist = useCallback(async () => {
    if (hasSyncedShortlist.current) return;

    const localIds = getLocalShortlist();
    if (localIds.length === 0) {
      hasSyncedShortlist.current = true;
      return;
    }

    try {
      const apiShortlist = await apiFetch<Shortlist[]>("shortlist");
      const apiIds = (apiShortlist ?? []).map((entry) => entry.developer.id);
      const idsToAdd = getMergeAdditions(localIds, apiIds);

      if (idsToAdd.length === 0) {
        clearLocalShortlist();
        hasSyncedShortlist.current = true;
        return;
      }

      const results = await Promise.allSettled(
        idsToAdd.map((developerId) =>
          apiFetch(`shortlist/${developerId}`, { method: "POST" }),
        ),
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;

      if (successCount === 0) return;

      clearLocalShortlist();
      hasSyncedShortlist.current = true;
      qc.invalidateQueries({ queryKey: queryKeys.shortlist });
      qc.invalidateQueries({ queryKey: queryKeys.shortlistCount });
    } catch {
      toast.error("Failed to sync shortlist", {
        description: "Your saved developers will be synced next time you log in.",
      });
    }
  }, [qc]);

  useEffect(() => {
    if (auth0Loading) return;

    if (isAuthenticated && auth0User && auth0User.email_verified === false) {
      const hasShownToast = sessionStorage.getItem(VERIFICATION_TOAST_SHOWN_KEY);
      if (!hasShownToast) {
        sessionStorage.setItem(VERIFICATION_TOAST_SHOWN_KEY, "true");
        toast.warning("Please verify your email to continue", {
          description: "Check your inbox and click the verification link, then sign in again",
          duration: 10000,
        });
        logout({ openUrl: false });
      }
    }
  }, [auth0Loading, isAuthenticated, auth0User, logout]);

  useEffect(() => {
    if (!isAuthenticated && !auth0Loading) {
      sessionStorage.removeItem(VERIFICATION_TOAST_SHOWN_KEY);
    }
  }, [isAuthenticated, auth0Loading]);

  useEffect(() => {
    if (auth0Loading) return;

    if (!isAuthenticated) {
      hasSyncedShortlist.current = false;
      prevAuthenticated.current = false;
      return;
    }

    if (
      isAuthenticated &&
      auth0User?.email_verified &&
      hasUserRow &&
      !prevAuthenticated.current
    ) {
      prevAuthenticated.current = true;
      const timeoutId = setTimeout(() => {
        syncLocalShortlist();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [auth0Loading, isAuthenticated, auth0User, hasUserRow, syncLocalShortlist]);

  return <>{children}</>;
}
