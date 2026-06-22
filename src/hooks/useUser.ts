"use client";

import { useMe } from "@/lib/api/hooks/useMe";
import type { Developer, Recruiter } from "@/lib/api/types";

export type { UserType } from "@/lib/api/hooks/useMe";

export function useUser() {
  return useMe();
}

export function useDeveloperProfile(): Developer | null {
  const { isAuthenticated, isDeveloper, profile } = useMe();
  if (isAuthenticated && isDeveloper && profile) {
    return profile as Developer;
  }
  return null;
}

export function useRecruiterProfile(): Recruiter | null {
  const { isAuthenticated, isRecruiter, profile } = useMe();
  if (isAuthenticated && isRecruiter && profile) {
    return profile as Recruiter;
  }
  return null;
}

export type UserState = ReturnType<typeof useUser>;
