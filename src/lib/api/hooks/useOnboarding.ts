"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  AnswerSubmitResult,
  CompleteRequest,
  Developer,
  DraftProfile,
  OnboardingSession,
} from "@/lib/api/types";

function invalidateProfile(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.me });
  qc.invalidateQueries({ queryKey: queryKeys.developerMe });
  qc.invalidateQueries({ queryKey: queryKeys.onboardingMe });
  qc.invalidateQueries({ queryKey: queryKeys.onboardingDraft });
}

/**
 * Active onboarding session for the current user. Returns null for 404 (no
 * active session) so EnsureProfile-style consumers can branch without
 * catching errors.
 */
export function useOnboardingSession(opts: { enabled?: boolean } = {}) {
  return useQuery<OnboardingSession | null>({
    queryKey: queryKeys.onboardingMe,
    queryFn: async () => {
      try {
        return await apiFetch<OnboardingSession>("onboarding/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: opts.enabled ?? true,
  });
}

export function useStartOnboarding() {
  const qc = useQueryClient();
  return useMutation<OnboardingSession, ApiError, void>({
    mutationFn: () =>
      apiFetch<OnboardingSession>("onboarding/start", { method: "POST" }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.onboardingMe, data);
    },
  });
}

export interface SubmitAnswerInput {
  audio: Blob;
  mimeType: string;
}

export function useSubmitAnswer() {
  const qc = useQueryClient();
  return useMutation<AnswerSubmitResult, ApiError, SubmitAnswerInput>({
    mutationFn: ({ audio, mimeType }) => {
      const form = new FormData();
      // Choose an extension hint the backend uses to set the temp-file suffix.
      // It's just a hint — Whisper relies on ffmpeg to sniff the real codec.
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      form.append("file", audio, `answer.${ext}`);
      return apiFetch<AnswerSubmitResult>("onboarding/me/answer", {
        method: "POST",
        body: form,
      });
    },
    onSuccess: (result) => {
      // Only invalidate when an answer was accepted — a retry response leaves
      // the session unchanged.
      if (result.accepted) {
        qc.invalidateQueries({ queryKey: queryKeys.onboardingMe });
      }
    },
  });
}

export function useExtractProfile() {
  const qc = useQueryClient();
  return useMutation<OnboardingSession, ApiError, void>({
    mutationFn: () =>
      apiFetch<OnboardingSession>("onboarding/me/extract", { method: "POST" }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.onboardingMe, data);
      if (data.extractedDraft) {
        qc.setQueryData(queryKeys.onboardingDraft, data.extractedDraft);
      }
    },
  });
}

export function useOnboardingDraft(opts: { enabled?: boolean } = {}) {
  return useQuery<DraftProfile>({
    queryKey: queryKeys.onboardingDraft,
    enabled: opts.enabled ?? true,
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation<Developer, ApiError, CompleteRequest>({
    mutationFn: (body) =>
      apiFetch<Developer>("onboarding/me/complete", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      // Invalidate profile queries so the dashboard sees fresh data, but DO
      // NOT touch `onboardingMe` here. The backend just flipped the session
      // to Completed — if we invalidate, `useOnboardingSession` refetches,
      // gets 404 → null, and `InterviewFlow` briefly renders InterviewIntro
      // ("Set up your profile in 5 minutes") while ReviewDraft is still
      // wrapping up. The stale ReadyForReview cache is fine here: by the
      // time it could be re-read the user is already on DeveloperProfile.
      qc.invalidateQueries({ queryKey: queryKeys.me });
      qc.invalidateQueries({ queryKey: queryKeys.developerMe });
      qc.invalidateQueries({ queryKey: queryKeys.recruiterMe });
    },
  });
}

export function useSkipOnboarding() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await apiFetch("onboarding/me/skip", { method: "POST" });
    },
    onSuccess: () => {
      qc.setQueryData(queryKeys.onboardingMe, null);
      qc.removeQueries({ queryKey: queryKeys.onboardingDraft });
    },
  });
}
