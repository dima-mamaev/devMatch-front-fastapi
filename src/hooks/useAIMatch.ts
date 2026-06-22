"use client";

/**
 * AI Match conversational hook.
 *
 * Owns the chat session lifecycle (load on mount → stream user turns →
 * persist messageId in localStorage so a refresh resumes the same thread)
 * and exposes the same shape the existing chat UI consumes.
 *
 * Streaming pipeline:
 *   fetch(POST /messages, body: { prompt })
 *     → readable body of SSE frames
 *     → parseSSE → events dispatched to the assistant-message reducer
 *     → message is "finalized" on COMPLETE / ERROR / CANCELLED
 */

import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/api-fetch";
import {
  cancelAIMatchSession,
  claimAIMatchSession,
  createAIMatchSession,
  deleteAIMatchSession,
  getAIMatchSession,
  streamMessage,
  type AIMatchMatchView,
  type AIMatchSessionView,
  type RateLimitInfo as ApiRateLimitInfo,
} from "@/lib/api/aiMatch";
import { parseSSE } from "@/lib/api/sse";

const SESSION_STORAGE_KEY = "devmatch_aimatch_session_id";

// ---------------------------------------------------------------------------
// Types (kept exported for the existing ChatMessage / DeveloperMatchCard
// components that import them).

export type AIMatchEventType =
  | "CONNECTED"
  | "MESSAGE_QUEUED"
  | "MESSAGE_STARTED"
  | "THINKING"
  | "TOOL_CALL"
  | "TOOL_RESULT"
  | "MATCH_FOUND"
  | "COMPLETE"
  | "ERROR"
  | "CANCELLED"
  | "RATE_LIMITED";

export interface DeveloperMatch {
  developerId: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  location?: string;
  techStack?: string[];
  seniorityLevel?: string;
  availabilityStatus?: string;
  score: number;
  reasoning: string;
  profilePhotoUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  matches?: DeveloperMatch[];
  isStreaming?: boolean;
  thinkingSteps?: string[];
  toolCalls?: Array<{
    name: string;
    status: "pending" | "running" | "completed";
    result?: string;
  }>;
  error?: string;
}

interface UseAIMatchReturn {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  rateLimitInfo: ApiRateLimitInfo | null;
  userType: string | null;
  startSession: () => Promise<void>;
  sendMessage: (prompt: string) => Promise<void>;
  cancelCurrent: () => Promise<void>;
  clearMessages: (startFresh?: boolean) => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Helpers


function readStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

function writeStoredSessionId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id === null) window.localStorage.removeItem(SESSION_STORAGE_KEY);
  else window.localStorage.setItem(SESSION_STORAGE_KEY, id);
}

function devMatchFromView(m: AIMatchMatchView): DeveloperMatch {
  return {
    developerId: m.developerId,
    firstName: m.developer?.firstName,
    lastName: m.developer?.lastName,
    jobTitle: m.developer?.jobTitle ?? undefined,
    location: m.developer?.location ?? undefined,
    techStack: m.developer?.techStack,
    seniorityLevel: m.developer?.seniorityLevel ?? undefined,
    availabilityStatus: m.developer?.availabilityStatus ?? undefined,
    profilePhotoUrl: m.developer?.profilePhotoUrl ?? undefined,
    score: m.matchScore,
    reasoning: m.matchReason,
  };
}

function viewToChatMessages(session: AIMatchSessionView): ChatMessage[] {
  return session.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.createdAt),
    matches: m.matches ? m.matches.map(devMatchFromView) : undefined,
    toolCalls: m.toolCalls
      ? m.toolCalls.map((tc) => ({
          name: tc.name,
          status: tc.status,
          result: tc.resultSummary ?? undefined,
        }))
      : undefined,
    error: m.error ?? undefined,
    isStreaming: false,
  }));
}

// ---------------------------------------------------------------------------
// SSE event payload shapes — match what `app/ai_match/events.py` emits.

interface ConnectedPayload {
  sessionId: string;
  rateLimit: ApiRateLimitInfo | null;
}
interface MessageQueuedPayload {
  messageId: string;
}
interface ThinkingPayload {
  message: string;
}
interface ToolCallPayload {
  toolName: string;
  args: Record<string, unknown>;
}
interface ToolResultPayload {
  toolName: string;
  resultSummary: string;
  candidateCount: number | null;
}
interface MatchFoundPayload {
  position: number;
  match: AIMatchMatchView;
}
interface CompletePayload {
  summary: string;
  totalMatches: number;
  totalCandidates: number | null;
}
interface ErrorPayload {
  errorMessage: string;
  isOffTopic: boolean;
}
interface RateLimitedPayload {
  resetsAt: string | null;
}

// ---------------------------------------------------------------------------

export function useAIMatch(): UseAIMatchReturn {
  const { isAuthenticated } = useAuth0();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] =
    useState<ApiRateLimitInfo | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // Lock so concurrent re-renders don't double-init the session.
  const initRef = useRef(false);
  // Track which auth state the session was last bound to so we can detect a
  // guest → user flip and run a claim. ``null`` means "no session yet".
  const sessionAuthRef = useRef<"guest" | "user" | null>(null);
  // One auto-resume attempt per page load. If the resume itself fails (server
  // error, rate-limit, etc.) we don't retry forever — the user can refresh.
  const autoResumeRef = useRef(false);

  // Mount: load existing session by stored id, else create a new one.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        const stored = readStoredSessionId();
        if (stored) {
          try {
            const { session, rateLimit } = await getAIMatchSession(stored);
            setSessionId(session.id);
            setMessages(viewToChatMessages(session));
            if (rateLimit) setRateLimitInfo(rateLimit);
            sessionAuthRef.current = isAuthenticated ? "user" : "guest";
            return;
          } catch (err) {
            // 404 = stale session. 403 = ownership changed (e.g. guest
            // session from yesterday's salt rotation, or accessed from a
            // different IP). Either way, drop it and create a fresh one.
            const isStale =
              err instanceof ApiError &&
              (err.status === 404 || err.status === 403);
            if (!isStale) throw err;
            writeStoredSessionId(null);
          }
        }
        const { session, rateLimit } = await createAIMatchSession();
        writeStoredSessionId(session.id);
        setSessionId(session.id);
        setMessages([]);
        if (rateLimit) setRateLimitInfo(rateLimit);
        sessionAuthRef.current = isAuthenticated ? "user" : "guest";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start a session.");
      } finally {
        setIsLoading(false);
      }
    };
    init();

    return () => {
      // If the page unmounts mid-stream, cancel the underlying fetch so the
      // backend stops working. The cancel-endpoint flag will close out the
      // assistant row on the server.
      abortRef.current?.abort();
    };
    // isAuthenticated is intentionally NOT a dep — the auth-flip claim is
    // handled by the effect below, which runs only on the transition itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth-state flip: claim a guest-owned session for the freshly-authenticated
  // user. The recruiter shouldn't lose their thread on signup. If the claim
  // returns 403 (different IP, day rolled over, etc.), drop the stored id and
  // start a new authenticated session.
  useEffect(() => {
    if (!sessionId) return;
    if (!isAuthenticated) return;
    if (sessionAuthRef.current === "user") return;
    let cancelled = false;
    (async () => {
      try {
        const { session, rateLimit } = await claimAIMatchSession(sessionId);
        if (cancelled) return;
        setSessionId(session.id);
        setMessages(viewToChatMessages(session));
        if (rateLimit) setRateLimitInfo(rateLimit);
        sessionAuthRef.current = "user";
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
          // Stale or not-ours — drop and create a fresh authenticated session.
          writeStoredSessionId(null);
          try {
            const { session, rateLimit } = await createAIMatchSession();
            writeStoredSessionId(session.id);
            setSessionId(session.id);
            setMessages([]);
            if (rateLimit) setRateLimitInfo(rateLimit);
            sessionAuthRef.current = "user";
          } catch (createErr) {
            setError(
              createErr instanceof Error
                ? createErr.message
                : "Failed to start a session.",
            );
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, isAuthenticated]);

  // -------------------------------------------------------------------------
  // Streaming dispatch

  const dispatchEvent = useCallback(
    (assistantId: string, event: string, data: unknown) => {
      const updateAssistant = (
        patch:
          | Partial<ChatMessage>
          | ((prev: ChatMessage) => Partial<ChatMessage>),
      ) =>
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            const next = typeof patch === "function" ? patch(m) : patch;
            return { ...m, ...next };
          }),
        );

      switch (event) {
        case "CONNECTED": {
          const p = data as ConnectedPayload;
          if (p.rateLimit) setRateLimitInfo(p.rateLimit);
          break;
        }
        case "MESSAGE_QUEUED": {
          // Backend assigned a real id to the user message — but we already
          // optimistically rendered it. We could reconcile, but the optimistic
          // id is fine for the UI and the server-side id is only useful for
          // history loads.
          void (data as MessageQueuedPayload);
          break;
        }
        case "MESSAGE_STARTED":
          break;
        case "THINKING": {
          const p = data as ThinkingPayload;
          updateAssistant((prev) => ({
            thinkingSteps: [...(prev.thinkingSteps ?? []), p.message],
          }));
          break;
        }
        case "TOOL_CALL": {
          const p = data as ToolCallPayload;
          updateAssistant((prev) => ({
            toolCalls: [
              ...(prev.toolCalls ?? []),
              { name: p.toolName, status: "running" },
            ],
          }));
          break;
        }
        case "TOOL_RESULT": {
          const p = data as ToolResultPayload;
          updateAssistant((prev) => {
            const calls = [...(prev.toolCalls ?? [])];
            // Mark the most recent running call for this tool as completed.
            for (let i = calls.length - 1; i >= 0; i--) {
              if (calls[i].name === p.toolName && calls[i].status !== "completed") {
                calls[i] = {
                  ...calls[i],
                  status: "completed",
                  result: p.resultSummary,
                };
                break;
              }
            }
            return { toolCalls: calls };
          });
          break;
        }
        case "MATCH_FOUND": {
          const p = data as MatchFoundPayload;
          updateAssistant((prev) => ({
            matches: [...(prev.matches ?? []), devMatchFromView(p.match)],
          }));
          break;
        }
        case "COMPLETE": {
          const p = data as CompletePayload;
          updateAssistant({
            content: p.summary,
            isStreaming: false,
          });
          break;
        }
        case "ERROR": {
          const p = data as ErrorPayload;
          updateAssistant({
            content: p.errorMessage,
            error: p.isOffTopic ? "off_topic" : p.errorMessage,
            isStreaming: false,
          });
          break;
        }
        case "CANCELLED": {
          updateAssistant({
            content: "Cancelled.",
            isStreaming: false,
          });
          break;
        }
        case "RATE_LIMITED": {
          const p = data as RateLimitedPayload;
          updateAssistant({
            content: "Daily search limit reached.",
            error: "rate_limited",
            isStreaming: false,
          });
          if (p.resetsAt) {
            setRateLimitInfo((prev) =>
              prev ? { ...prev, remaining: 0, resetsAt: p.resetsAt! } : prev,
            );
          }
          break;
        }
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Public actions

  const startSession = useCallback(async () => {
    setError(null);
    setMessages([]);
    setIsLoading(true);
    try {
      const { session, rateLimit } = await createAIMatchSession();
      writeStoredSessionId(session.id);
      setSessionId(session.id);
      if (rateLimit) setRateLimitInfo(rateLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start a session.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (prompt: string) => {
      if (!sessionId || !prompt.trim() || isProcessing) return;
      setError(null);
      setIsProcessing(true);

      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();

      const userMsg: ChatMessage = {
        id: userId,
        role: "user",
        content: prompt,
        timestamp: new Date(),
      };
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        thinkingSteps: [],
        toolCalls: [],
        matches: [],
      };
      setMessages((prev) => {
        // If the trailing message is an orphaned user question with the same
        // content (auto-resume after a disconnect), replace it instead of
        // stacking a duplicate bubble. The backend does the same cleanup on
        // its side so the DB stays consistent.
        const last = prev[prev.length - 1];
        if (last && last.role === "user" && last.content === prompt) {
          return [...prev.slice(0, -1), userMsg, assistantMsg];
        }
        return [...prev, userMsg, assistantMsg];
      });

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await streamMessage(sessionId, prompt, controller.signal);
        for await (const evt of parseSSE(response, controller.signal)) {
          dispatchEvent(assistantId, evt.event, evt.data);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          // The cancel-button path already wrote a "Cancelled" message; this
          // catch fires when the user navigates away. Either way, leave the
          // assistant row as-is.
        } else if (err instanceof ApiError && err.status === 429) {
          // The decorator rejected before any SSE body was sent. Surface as
          // a final state on the assistant message.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: "Daily search limit reached.",
                    error: "rate_limited",
                    isStreaming: false,
                  }
                : m,
            ),
          );
          setRateLimitInfo((prev) => (prev ? { ...prev, remaining: 0 } : prev));
        } else {
          const message =
            err instanceof Error ? err.message : "Stream failed.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: message, error: "stream", isStreaming: false }
                : m,
            ),
          );
          setError(message);
        }
      } finally {
        setIsProcessing(false);
        abortRef.current = null;
      }
    },
    [sessionId, isProcessing, dispatchEvent],
  );

  // Auto-resume an orphan question on page mount.
  //
  // If the trailing persisted message is an unanswered user prompt — meaning
  // a previous stream was interrupted (user navigated away mid-turn) — fire
  // `sendMessage` automatically so they don't have to manually retry. The
  // backend dedupes the orphan row inside ``run_turn`` so the conversation
  // doesn't end up with two identical user bubbles.
  //
  // Fires at most ONCE per page load. If the resume itself fails (rate
  // limit, server error, etc.) we don't keep retrying — the user can refresh
  // or send a new prompt.
  useEffect(() => {
    if (autoResumeRef.current) return;
    if (isLoading || isProcessing) return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "user") return;
    autoResumeRef.current = true;
    // sendMessage internally calls setState — intentional here. The
    // autoResumeRef guard plus the early-returns above prevent the
    // cascading-render concern the lint rule warns about.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void sendMessage(last.content);
  }, [isLoading, isProcessing, messages, sendMessage]);

  const cancelCurrent = useCallback(async () => {
    if (!sessionId) return;
    try {
      await cancelAIMatchSession(sessionId);
    } catch {
      // Best-effort — the abort below still stops the local fetch.
    }
    abortRef.current?.abort();
  }, [sessionId]);

  const clearMessages = useCallback(
    (startFresh = false) => {
      const prevSessionId = sessionId;
      if (!startFresh) {
        setMessages([]);
        setError(null);
        return;
      }
      // Start fresh: delete the old session on the server and create a new one.
      (async () => {
        setIsLoading(true);
        try {
          if (prevSessionId) {
            await deleteAIMatchSession(prevSessionId);
          }
          const { session, rateLimit } = await createAIMatchSession();
          writeStoredSessionId(session.id);
          setSessionId(session.id);
          setMessages([]);
          setError(null);
          if (rateLimit) setRateLimitInfo(rateLimit);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to start a new chat.",
          );
        } finally {
          setIsLoading(false);
        }
      })();
    },
    [sessionId],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    sessionId,
    messages,
    isLoading,
    isProcessing,
    error,
    rateLimitInfo,
    userType: isAuthenticated ? null : "guest",
    startSession,
    sendMessage,
    cancelCurrent,
    clearMessages,
    clearError,
  };
}
