"use client";

import { useEffect, useRef, useState } from "react";

import { useExtractProfile } from "@/lib/api/hooks/useOnboarding";
import type { DraftProfile } from "@/lib/api/types";

interface ExtractingProfileProps {
  onReady: (draft: DraftProfile) => void;
  onSkip: () => void;
}

export function ExtractingProfile({ onReady, onSkip }: ExtractingProfileProps) {
  const extract = useExtractProfile();
  const [error, setError] = useState<string | null>(null);
  // Fire-once guard so React Strict Mode in dev doesn't double-extract.
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    extract
      .mutateAsync()
      .then((session) => {
        if (session.extractedDraft) {
          onReady(session.extractedDraft);
        } else {
          setError("We couldn't generate your profile. Try again or use the manual form.");
        }
      })
      .catch((err) => {
        setError((err as Error).message || "Extraction failed");
      });
    // We intentionally exclude `extract` and callbacks — they're not stable refs
    // and rerunning would re-fire the mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    setError(null);
    firedRef.current = false;
    // Trigger re-fire by forcing a re-render via state — easiest is to re-run
    // the effect's body inline.
    extract
      .mutateAsync()
      .then((session) => {
        if (session.extractedDraft) {
          onReady(session.extractedDraft);
        } else {
          setError("We couldn't generate your profile. Try again or use the manual form.");
        }
      })
      .catch((err) => {
        setError((err as Error).message || "Extraction failed");
      });
  };

  if (error) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          <p className="font-semibold mb-1">Couldn&apos;t generate your profile</p>
          <p>{error}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="flex-1 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Use manual form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-12 text-center">
      <div className="flex justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900">Drafting your profile…</h2>
        <p className="text-sm text-slate-500">
          We&apos;re pulling out your job, skills, and past roles. Takes about 15 seconds.
        </p>
      </div>
    </div>
  );
}
