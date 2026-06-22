"use client";

import { useMemo, useState } from "react";

import { useOnboarding } from "@/contexts/OnboardingContext";
import { useDeveloperProfile } from "@/hooks/useUser";
import { useOnboardingSession } from "@/lib/api/hooks/useOnboarding";
import type { Developer, OnboardingSession } from "@/lib/api/types";

export type OnboardingStep =
  | "interview"
  | "intro"
  | "photo-name"
  | "role-location"
  | "experience"
  | "tech-stack"
  | "links-bio"
  | "intro-video"
  | "complete";

const SKIP_INTERVIEW_KEY_PREFIX = "devmatch_onboarding_skip_interview:";

function skipKey(developerId: string | undefined): string | null {
  return developerId ? `${SKIP_INTERVIEW_KEY_PREFIX}${developerId}` : null;
}

function readSkipFlag(developerId: string | undefined): boolean {
  if (typeof window === "undefined") return false;
  const key = skipKey(developerId);
  return key !== null && window.localStorage.getItem(key) === "1";
}

function writeSkipFlag(developerId: string | undefined, value: boolean): void {
  if (typeof window === "undefined") return;
  const key = skipKey(developerId);
  if (!key) return;
  if (value) window.localStorage.setItem(key, "1");
  else window.localStorage.removeItem(key);
}

function getManualStartingStep(profile: Developer | null): OnboardingStep {
  if (!profile) return "intro";
  if (!(profile.firstName && profile.lastName && profile.profilePhoto))
    return "photo-name";
  if (!(profile.jobTitle && profile.location)) return "role-location";
  if (!profile.seniorityLevel) return "experience";
  if (profile.techStack.length === 0) return "tech-stack";
  if (!(profile.bio && profile.githubUrl && profile.linkedinUrl))
    return "links-bio";
  if (!profile.introVideo) return "intro-video";
  return "complete";
}

/**
 * Fresh = scalar profile is still empty beyond what signup populated. Used to
 * decide whether to offer the AI interview to a dev who has no session yet.
 * First/last names from Auth0 don't count as "started filling in" — bio /
 * jobTitle / techStack / experiences / photo are the meaningful signals.
 */
function isFreshForInterview(profile: Developer | null): boolean {
  if (!profile) return true;
  if (profile.jobTitle) return false;
  if (profile.bio) return false;
  if (profile.techStack.length > 0) return false;
  if (profile.experiences.length > 0) return false;
  if (profile.profilePhoto) return false;
  return true;
}

function decideStartingStep(args: {
  profile: Developer | null;
  session: OnboardingSession | null | undefined;
  showComplete: boolean;
  hasSkipped: boolean;
}): OnboardingStep {
  if (args.showComplete) return "complete";
  if (
    args.session &&
    (args.session.status === "InProgress" ||
      args.session.status === "ReadyForReview")
  ) {
    return "interview";
  }
  if (
    isFreshForInterview(args.profile) &&
    args.session === null &&
    !args.hasSkipped
  ) {
    return "interview";
  }
  return getManualStartingStep(args.profile);
}

export interface OnboardingStateMachine {
  /** ``null`` until both the profile and the session queries have landed. */
  step: OnboardingStep | null;
  goTo: (step: OnboardingStep) => void;
  /** Clear the skip flag and re-enter the interview track. */
  enterInterview: () => void;
  /** Persist the skip flag and bounce to the manual intro. */
  exitInterviewToManual: () => void;
  /** Release the wrapper lock so the editor can take over. */
  finishInterview: () => void;
  /** Lock the wrapper and jump to the manual "complete" screen. */
  markComplete: () => void;
}

/**
 * Centralizes the onboarding flow's step-decision logic so the component
 * doesn't have to choreograph profile + session refetches, the skip flag,
 * and the wrapper-lock by hand. Behavior is identical to the previous
 * in-component useEffect chain — this is purely a refactor.
 */
export function useOnboardingStateMachine(): OnboardingStateMachine {
  const profile = useDeveloperProfile();
  const onboardingSession = useOnboardingSession();
  const { showComplete, setShowComplete } = useOnboarding();

  const startingStep = useMemo(
    () =>
      decideStartingStep({
        profile,
        session: onboardingSession.data,
        showComplete,
        hasSkipped: readSkipFlag(profile?.id),
      }),
    [profile, onboardingSession.data, showComplete],
  );

  // ``userStep`` is set the moment the user navigates and from then on takes
  // precedence over the derived starting step. Until both queries have landed
  // we expose ``null`` so the component can show a spinner instead of flashing
  // the manual intro.
  const hasSettled = !!profile && !onboardingSession.isLoading;
  const [userStep, setUserStep] = useState<OnboardingStep | null>(null);
  const step: OnboardingStep | null =
    userStep ?? (hasSettled ? startingStep : null);

  return {
    step,
    goTo: setUserStep,
    enterInterview: () => {
      writeSkipFlag(profile?.id, false);
      setUserStep("interview");
    },
    exitInterviewToManual: () => {
      writeSkipFlag(profile?.id, true);
      setUserStep("intro");
    },
    finishInterview: () => {
      // ReviewDraft has already committed everything and refetched the
      // developer — releasing the wrapper lock lets the editor take over
      // with fresh cache (photo set, video processing).
      setShowComplete(false);
    },
    markComplete: () => {
      setShowComplete(true);
      setUserStep("complete");
    },
  };
}
