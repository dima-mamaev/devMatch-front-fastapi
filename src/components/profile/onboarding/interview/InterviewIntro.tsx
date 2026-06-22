"use client";

import { toast } from "sonner";

import { ArrowRightIcon, SparklesIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useStartOnboarding } from "@/lib/api/hooks/useOnboarding";

interface InterviewIntroProps {
  onStarted: () => void;
  onSkip: () => void;
}

const steps = [
  { emoji: "🎙️", label: "Answer 5 short voice questions about your work" },
  { emoji: "✨", label: "We draft your profile — title, bio, skills, past roles, certs" },
  { emoji: "📸", label: "Review the draft, then add your photo and intro video" },
];

export function InterviewIntro({ onStarted, onSkip }: InterviewIntroProps) {
  const start = useStartOnboarding();

  const handleStart = async () => {
    try {
      await start.mutateAsync();
      onStarted();
    } catch {
      toast.error("Couldn't start the interview. Try again or use the manual form.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-slate-50 p-6">
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm w-full max-w-115 p-8">
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 100%)",
            }}
          >
            <SparklesIcon className="w-9 h-9 text-white" />
          </div>
        </div>

        <h1 className="text-[28px] font-extrabold text-slate-900 text-center leading-tight">
          Set up your profile in 5 minutes
        </h1>
        <p className="text-slate-500 text-center mt-2 leading-relaxed">
          Just talk — we&apos;ll turn your answers into a profile.{" "}
          <span className="font-semibold text-indigo-600">You can edit everything</span>{" "}
          before saving.
        </p>

        <div className="flex flex-col gap-3 mt-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3.5"
            >
              <span className="text-xl">{step.emoji}</span>
              <span className="text-sm font-medium text-slate-700">{step.label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">
          We record audio to transcribe your answers. Audio is deleted after transcription —
          only the transcript is saved.
        </p>

        <div className="flex flex-col items-center gap-2 mt-6">
          <Button
            variant="gradient"
            size="lg"
            onClick={handleStart}
            disabled={start.isPending}
            type="button"
            className="rounded-2xl font-bold"
          >
            {start.isPending ? "Starting…" : "Start interview"}
            {!start.isPending && <ArrowRightIcon className="w-4.5 h-4.5" />}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Prefer to type? Use the manual form instead
          </button>
        </div>
      </div>
    </div>
  );
}
