"use client";

import { useState } from "react";
import { VoiceRecorder } from "@/components/profile/onboarding/interview/VoiceRecorder";

/**
 * Dev-only sandbox for the VoiceRecorder. No auth, no API — just record,
 * play back, "submit" pretends to call the backend. Use this to dial in the
 * silence threshold, level-meter feel, and mic-permission UX without
 * dragging the rest of the onboarding flow along.
 */
export default function VoiceTestPage() {
  const [log, setLog] = useState<string[]>([]);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);

  const append = (msg: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 20));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">VoiceRecorder sandbox</h1>
          <p className="text-sm text-slate-500">
            Dev-only. No API call — submit just logs the blob below.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <VoiceRecorder
            submitLabel="Pretend submit"
            onSubmit={async (blob, mime) => {
              setLastBlob(blob);
              append(`submit: ${(blob.size / 1024).toFixed(1)} KB, mime=${mime}`);
              await new Promise((r) => setTimeout(r, 500));
            }}
          />
        </div>

        {lastBlob && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            Last blob: {(lastBlob.size / 1024).toFixed(1)} KB &middot; type={lastBlob.type || "(empty)"}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Log</h2>
          {log.length === 0 ? (
            <p className="text-xs text-slate-400">No events yet.</p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-700 font-mono">
              {log.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
