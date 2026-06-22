"use client";

import { useState } from "react";

import {
  useOnboardingSession,
  useSkipOnboarding,
} from "@/lib/api/hooks/useOnboarding";
import type { Developer, DraftProfile } from "@/lib/api/types";

import { ExtractingProfile } from "./ExtractingProfile";
import { InterviewIntro } from "./InterviewIntro";
import { InterviewQuestion } from "./InterviewQuestion";
import { ReviewDraft } from "./ReviewDraft";

interface InterviewFlowProps {
  onCompleted: (developer: Developer) => void;
  onSkip: () => void;
}

/**
 * Orchestrator for the voice-interview sub-flow.
 *
 * Reads the backend session state and renders the matching sub-step:
 *   - no active session            → InterviewIntro (CTA + privacy note)
 *   - InProgress                   → InterviewQuestion (one question at a time)
 *   - ReadyForReview, no draft yet → ExtractingProfile (Claude is running)
 *   - ReadyForReview, draft set    → ReviewDraft (editable form)
 *
 * Skip at any step calls the backend, marks the session Abandoned, and bubbles
 * up to the host so it can switch to the manual onboarding flow.
 */
export function InterviewFlow({ onCompleted, onSkip }: InterviewFlowProps) {
  const sessionQuery = useOnboardingSession();
  const skip = useSkipOnboarding();
  const [localDraft, setLocalDraft] = useState<DraftProfile | null>(null);

  const handleSkip = async () => {
    try {
      await skip.mutateAsync();
    } finally {
      onSkip();
    }
  };

  if (sessionQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
      </div>
    );
  }

  const session = sessionQuery.data;

  if (!session) {
    return <InterviewIntro onStarted={() => sessionQuery.refetch()} onSkip={handleSkip} />;
  }

  if (session.status === "InProgress") {
    return (
      <InterviewQuestion
        session={session}
        onAdvance={() => sessionQuery.refetch()}
        onReady={() => sessionQuery.refetch()}
        onSkip={handleSkip}
      />
    );
  }

  if (session.status === "ReadyForReview") {
    // Prefer the local copy if the user has been editing — refetching the
    // session could otherwise clobber in-progress edits.
    const draft = localDraft ?? session.extractedDraft ?? null;
    if (!draft) {
      return (
        <ExtractingProfile
          onReady={(d) => setLocalDraft(d)}
          onSkip={handleSkip}
        />
      );
    }
    return (
      <ReviewDraft
        draft={draft}
        onCompleted={onCompleted}
        onSkip={handleSkip}
      />
    );
  }

  // Completed / Abandoned — host should have moved on already. Render nothing
  // to avoid flashing the wrong screen during the transition.
  return null;
}
