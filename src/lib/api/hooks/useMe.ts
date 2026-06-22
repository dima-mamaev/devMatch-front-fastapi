"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useQuery } from "@tanstack/react-query";

import { ApiError, apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/api/queryKeys";
import type { Developer, Recruiter, User } from "@/lib/api/types";

async function fetchDeveloperMe(): Promise<Developer | null> {
  try {
    return await apiFetch<Developer>("developers/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function fetchRecruiterMe(): Promise<Recruiter | null> {
  try {
    return await apiFetch<Recruiter>("recruiters/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export type UserType =
  | "guest"
  | "pending"
  | "developer"
  | "recruiter"
  | "admin";

export interface UseMeResult {
  isLoading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  user: User | null;
  profile: Developer | Recruiter | null;
  isDeveloper: boolean;
  isRecruiter: boolean;
  needsSignupCompletion: boolean;
  userType: UserType;
  refetch: () => void;
}

export function useMe(): UseMeResult {
  const {
    isAuthenticated: auth0Authenticated,
    isLoading: auth0Loading,
    user: auth0User,
  } = useAuth0();

  const meQuery = useQuery<User>({
    queryKey: queryKeys.me,
    enabled: auth0Authenticated,
    staleTime: 60_000,
  });

  const role = meQuery.data?.role ?? null;

  const devQuery = useQuery<Developer | null>({
    queryKey: queryKeys.developerMe,
    queryFn: fetchDeveloperMe,
    enabled: auth0Authenticated && role === "Developer",
  });

  const recruiterQuery = useQuery<Recruiter | null>({
    queryKey: queryKeys.recruiterMe,
    queryFn: fetchRecruiterMe,
    enabled: auth0Authenticated && role === "Recruiter",
  });

  const meErr = meQuery.error as ApiError | null;
  // The 403 `complete_signup_required` detail is how the backend tells us the
  // JWT is valid but no User row exists yet — EnsureProfile reads this.
  const needsSignupCompletion =
    auth0Authenticated &&
    !!meErr &&
    meErr.status === 403 &&
    meErr.message === "complete_signup_required";

  const profileLoading =
    role === "Developer"
      ? devQuery.isLoading
      : role === "Recruiter"
        ? recruiterQuery.isLoading
        : false;
  const isLoading =
    auth0Loading || (auth0Authenticated && (meQuery.isLoading || profileLoading));

  const user = meQuery.data ?? null;
  const profile: Developer | Recruiter | null =
    role === "Developer"
      ? devQuery.data ?? null
      : role === "Recruiter"
        ? recruiterQuery.data ?? null
        : null;

  const userType: UserType = !auth0Authenticated
    ? "guest"
    : needsSignupCompletion
      ? "pending"
      : role === "Developer"
        ? "developer"
        : role === "Recruiter"
          ? "recruiter"
          : role === "Admin"
            ? "admin"
            : "guest";

  return {
    isLoading,
    isGuest: !isLoading && !auth0Authenticated,
    isAuthenticated: !isLoading && !!user,
    isEmailVerified: auth0User?.email_verified ?? false,
    user,
    profile,
    isDeveloper: role === "Developer",
    isRecruiter: role === "Recruiter",
    needsSignupCompletion,
    userType,
    refetch: () => {
      meQuery.refetch();
      if (role === "Developer") devQuery.refetch();
      if (role === "Recruiter") recruiterQuery.refetch();
    },
  };
}
