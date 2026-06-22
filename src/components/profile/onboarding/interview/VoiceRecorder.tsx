"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice recorder with auto-stop on silence, live level meter, and
 * playback-before-submit. Designed to feel obvious — record, hear it back,
 * submit or re-record.
 *
 * Auto-stop logic: AudioContext + AnalyserNode polls input volume each frame.
 * When the rolling level stays under SILENCE_THRESHOLD for SILENCE_DURATION_MS,
 * we stop the recorder. We arm the silence detector only after the dev has
 * spoken at least once (peak-above-threshold) so a quiet startup doesn't
 * fire it instantly.
 *
 * MIME: we don't pin a codec — Chrome/Firefox give webm/opus, iOS Safari
 * gives mp4. faster-whisper handles both via ffmpeg.
 */

// 2s of silence was eating mid-sentence thinking pauses ("I worked at … X").
// 4s is forgiving enough that a normal thinking gap doesn't trip it but still
// avoids leaving the recorder running forever when the dev is done.
const SILENCE_THRESHOLD = 20; // 0..255 from getByteFrequencyData average
const SILENCE_DURATION_MS = 8000;
const SILENCE_DURATION_LABEL = "8 seconds";
const MAX_DURATION_MS = 120_000; // hard cap per answer
const MIN_DURATION_MS = 1_500; // reject Stop tapped accidentally before any speech

export type VoiceRecorderState =
  | "idle"
  | "requesting-permission"
  | "permission-denied"
  | "recording"
  | "recorded"
  | "submitting"
  | "error";

interface VoiceRecorderProps {
  onSubmit: (audio: Blob, mimeType: string) => Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

export function VoiceRecorder({
  onSubmit,
  submitLabel = "Submit answer",
  disabled,
}: VoiceRecorderProps) {
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0); // 0..1 for the meter
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMime, setRecordedMime] = useState<string>("");
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const silenceStartedAtRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const teardownStream = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    audioCtxRef.current?.close().catch(() => { });
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    hasSpokenRef.current = false;
    silenceStartedAtRef.current = null;
  }, []);

  useEffect(() => () => teardownStream(), [teardownStream]);

  useEffect(() => {
    return () => {
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    };
  }, [playbackUrl]);

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length; // 0..255
    setLevel(Math.min(1, avg / 80));

    if (avg > SILENCE_THRESHOLD) {
      hasSpokenRef.current = true;
      silenceStartedAtRef.current = null;
    } else if (hasSpokenRef.current) {
      const now = performance.now();
      if (silenceStartedAtRef.current === null) {
        silenceStartedAtRef.current = now;
      } else if (now - silenceStartedAtRef.current >= SILENCE_DURATION_MS) {
        stopRecording();
        return;
      }
    }

    const recDuration = performance.now() - startedAtRef.current;
    if (recDuration >= MAX_DURATION_MS) {
      stopRecording();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [stopRecording]);

  const start = useCallback(async () => {
    setError(null);
    setRecordedBlob(null);
    setRecordedMime("");
    if (playbackUrl) {
      URL.revokeObjectURL(playbackUrl);
      setPlaybackUrl(null);
    }
    setLevel(0);
    setElapsedMs(0);

    setState("requesting-permission");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setState("permission-denied");
      } else {
        setError("Could not access microphone");
        setState("error");
      }
      return;
    }
    streamRef.current = stream;

    const AudioCtx = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const mime = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const duration = performance.now() - startedAtRef.current;
      teardownStream();
      setElapsedMs(Math.round(duration));
      if (duration < MIN_DURATION_MS) {
        setError("That was too short. Tap Record and try again.");
        setState("error");
        return;
      }
      setRecordedBlob(blob);
      setRecordedMime(mime);
      setPlaybackUrl(URL.createObjectURL(blob));
      setState("recorded");
    };
    startedAtRef.current = performance.now();
    elapsedTimerRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current);
    }, 100);

    recorder.start();
    setState("recording");
    rafRef.current = requestAnimationFrame(tick);
  }, [playbackUrl, teardownStream, tick]);

  const reRecord = useCallback(() => {
    setRecordedBlob(null);
    setRecordedMime("");
    if (playbackUrl) {
      URL.revokeObjectURL(playbackUrl);
      setPlaybackUrl(null);
    }
    setState("idle");
  }, [playbackUrl]);

  const submit = useCallback(async () => {
    if (!recordedBlob) return;
    setState("submitting");
    setError(null);
    try {
      await onSubmit(recordedBlob, recordedMime);
      // On success, parent component swaps to next question — we just reset.
      setRecordedBlob(null);
      setRecordedMime("");
      if (playbackUrl) {
        URL.revokeObjectURL(playbackUrl);
        setPlaybackUrl(null);
      }
      setState("idle");
    } catch (err) {
      setError((err as Error).message || "Submit failed");
      setState("recorded"); // back to playback view so user can retry
    }
  }, [recordedBlob, recordedMime, onSubmit, playbackUrl]);

  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <div className="space-y-4">
      {state === "permission-denied" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold mb-1">We couldn&apos;t access your mic</p>
          <p>
            Allow microphone access in your browser settings and try again, or use the manual form
            instead.
          </p>
        </div>
      )}

      {state === "error" && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      {(state === "idle" || state === "permission-denied" || state === "error") && (
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "error" || state === "permission-denied"
            ? "Try again"
            : "Start recording"}
        </button>
      )}

      {state === "requesting-permission" && (
        <p className="text-sm text-slate-500 text-center">Waiting for mic permission…</p>
      )}

      {state === "recording" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Recording
            </span>
            <span>{seconds}s</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-indigo-500 transition-all duration-75"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="w-full rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Stop now
          </button>
          <p className="text-center text-xs text-slate-400">
            Recording auto-stops after {SILENCE_DURATION_LABEL} of silence — or tap Stop when done.
          </p>
        </div>
      )}

      {state === "recorded" && playbackUrl && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Recorded {seconds}s — listen back, then submit or re-record.
          </p>
          <audio src={playbackUrl} controls className="w-full" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reRecord}
              className="flex-1 rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={disabled}
              className="flex-1 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      )}

      {state === "submitting" && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
          Transcribing…
        </div>
      )}
    </div>
  );
}
