/**
 * AI Match REST + SSE client.
 *
 * `streamMessage` returns a `Response` whose body is an SSE stream — the
 * caller pipes it through `parseSSE` to consume events. The non-streaming
 * endpoints return parsed JSON.
 */

import { API_BASE_URL, ApiError, unwrapDetail } from "./api-fetch";
import { getToken } from "./tokenStore";

export interface AIMatchToolCallView {
  name: string;
  args?: Record<string, unknown> | null;
  status: "pending" | "running" | "completed";
  resultSummary?: string | null;
}

export interface AIMatchDeveloperView {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  bio?: string | null;
  techStack?: string[];
  seniorityLevel?: string | null;
  location?: string | null;
  availabilityStatus?: string | null;
  profilePhotoUrl?: string | null;
}

export interface AIMatchMatchView {
  developerId: string;
  matchScore: number;
  matchReason: string;
  developer?: AIMatchDeveloperView | null;
}

export interface AIMatchMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  matches?: AIMatchMatchView[] | null;
  toolCalls?: AIMatchToolCallView[] | null;
  error?: string | null;
  createdAt: string;
}

export interface AIMatchSessionView {
  id: string;
  title: string | null;
  messages: AIMatchMessageView[];
  createdAt: string;
  updatedAt: string;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetsAt: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function readRateLimitFromHeaders(headers: Headers): RateLimitInfo | null {
  const remaining = headers.get("X-AI-Match-Remaining");
  const limit = headers.get("X-AI-Match-Limit");
  const resetsAt = headers.get("X-AI-Match-Reset");
  if (remaining === null || limit === null || resetsAt === null) return null;
  return {
    remaining: Number(remaining),
    limit: Number(limit),
    resetsAt,
  };
}

async function parseError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    try {
      body = await response.text();
    } catch {
      body = null;
    }
  }
  return new ApiError(response.status, body, unwrapDetail(body));
}

export interface SessionFetchResult {
  session: AIMatchSessionView;
  rateLimit: RateLimitInfo | null;
}

export async function createAIMatchSession(): Promise<SessionFetchResult> {
  const response = await fetch(`${API_BASE_URL}/api/ai-match/sessions`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!response.ok) throw await parseError(response);
  const session = (await response.json()) as AIMatchSessionView;
  return { session, rateLimit: readRateLimitFromHeaders(response.headers) };
}

export async function getAIMatchSession(
  sessionId: string,
): Promise<SessionFetchResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/ai-match/sessions/${sessionId}`,
    { headers: await authHeaders() },
  );
  if (!response.ok) throw await parseError(response);
  const session = (await response.json()) as AIMatchSessionView;
  return { session, rateLimit: readRateLimitFromHeaders(response.headers) };
}

export async function deleteAIMatchSession(sessionId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/ai-match/sessions/${sessionId}`,
    { method: "DELETE", headers: await authHeaders() },
  );
  if (!response.ok && response.status !== 404) throw await parseError(response);
}

export async function cancelAIMatchSession(sessionId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/ai-match/sessions/${sessionId}/cancel`,
    { method: "POST", headers: await authHeaders() },
  );
  if (!response.ok && response.status !== 404) throw await parseError(response);
}

/**
 * Migrate a guest-owned session to the calling authenticated user. Called
 * post-login when a ``sessionId`` was already in localStorage from a guest
 * conversation — the recruiter shouldn't lose their thread on signup.
 */
export async function claimAIMatchSession(
  sessionId: string,
): Promise<SessionFetchResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/ai-match/sessions/${sessionId}/claim`,
    { method: "POST", headers: await authHeaders() },
  );
  if (!response.ok) throw await parseError(response);
  const session = (await response.json()) as AIMatchSessionView;
  return { session, rateLimit: readRateLimitFromHeaders(response.headers) };
}

/**
 * Open the SSE stream for one user message. The caller is responsible for
 * piping `response.body` through `parseSSE` and consuming events.
 *
 * `signal` aborts the underlying fetch — used by the hook when the user
 * triggers a cancel or unmounts the page mid-stream.
 */
export async function streamMessage(
  sessionId: string,
  prompt: string,
  signal: AbortSignal,
): Promise<Response> {
  const response = await fetch(
    `${API_BASE_URL}/api/ai-match/sessions/${sessionId}/messages`,
    {
      method: "POST",
      headers: {
        ...(await authHeaders()),
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ prompt }),
      signal,
    },
  );
  if (!response.ok) throw await parseError(response);
  return response;
}
