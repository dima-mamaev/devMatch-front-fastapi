"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useSubmitAnswer } from "@/lib/api/hooks/useOnboarding";
import type { OnboardingSession } from "@/lib/api/types";

import { VoiceRecorder } from "./VoiceRecorder";

interface InterviewQuestionProps {
  session: OnboardingSession;
  onAdvance: (session: { status: string; nextQuestion: string | null }) => void;
  onReady: () => void;
  onSkip: () => void;
}

export function InterviewQuestion({
  session,
  onAdvance,
  onReady,
  onSkip,
}: InterviewQuestionProps) {
  const submit = useSubmitAnswer();
  const [retryReason, setRetryReason] = useState<string | null>(null);

  const total = session.totalQuestions;
  const idx = session.currentQuestionIndex;
  const questionText = session.currentQuestion;

  const handleSubmit = async (audio: Blob, mimeType: string) => {
    setRetryReason(null);
    try {
      const result = await submit.mutateAsync({ audio, mimeType });
      if (!result.accepted) {
        setRetryReason(result.retryReason ?? "Please try again.");
        return;
      }
      if (result.status === "ReadyForReview") {
        onReady();
      } else {
        onAdvance({
          status: result.status ?? "InProgress",
          nextQuestion: result.nextQuestion ?? null,
        });
      }
    } catch (err) {
      const msg = (err as Error).message || "Submit failed";
      toast.error(msg);
      throw err; // let VoiceRecorder revert to playback state
    }
  };

  if (!questionText) {
    return null;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Question {idx + 1} of {total}
        </p>
        <h2 className="text-xl font-bold text-slate-900">{questionText}</h2>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < idx ? "bg-indigo-600" : i === idx ? "bg-indigo-300" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {retryReason && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {retryReason}
        </div>
      )}

      <VoiceRecorder
        onSubmit={handleSubmit}
        submitLabel={idx + 1 === total ? "Submit final answer" : "Submit & next"}
      />

      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Skip the interview &middot; use manual form
        </button>
      </div>
    </div>
  );
}
