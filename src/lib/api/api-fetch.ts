import { requireEnv } from "@/lib/utils/env";
import { setQueryParams } from "./api-utils";
import { getToken, refreshToken } from "./tokenStore";

// Required at module load — a missing ``NEXT_PUBLIC_API_URL`` in prod
// previously fell back to ``http://localhost:4000``, baking localhost
// into the user-facing bundle. Failing loudly here surfaces the misconfig
// before the first request goes out.
export const API_BASE_URL = requireEnv(
  "NEXT_PUBLIC_API_URL",
  process.env.NEXT_PUBLIC_API_URL,
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown, message?: string) {
    super(message || `Request failed: ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

export function unwrapDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (first?.msg) return first.msg;
  }
  if (detail && typeof detail === "object" && "detail" in detail) {
    return unwrapDetail((detail as { detail: unknown }).detail);
  }
  return "Request failed";
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

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  params?: unknown;
  headers?: HeadersInit;
  body?: BodyInit | null;
  signal?: AbortSignal;
  /**
   * Internal — set automatically when ``apiFetch`` retries itself after a
   * 401 + token refresh. Bounds the retry to one attempt so a non-token
   * 401 (real permission denied) can't trigger an infinite loop.
   */
  _retried?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const { method = "GET", params, headers, body, signal, _retried = false } = opts;
  const token = await getToken();
  const isFormData = body instanceof FormData;
  const mergedHeaders: Record<string, string> = {
    ...(!isFormData && body !== undefined && body !== null
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  const search = setQueryParams(params);
  const url = `${API_BASE_URL}/api/${path}${search ? `?${search}` : ""}`;

  const response = await fetch(url, {
    method,
    headers: mergedHeaders,
    body,
    signal,
  });

  // 401 + we haven't retried yet → ask Auth0 for a fresh token, retry once.
  // If the refresh fails (e.g. user's Auth0 session expired) ``refreshToken``
  // returns null and we fall through to the normal error path — the toast
  // user sees then is the right signal to sign in again.
  if (response.status === 401 && !_retried) {
    const freshToken = await refreshToken();
    if (freshToken) {
      return apiFetch<T>(path, { ...opts, _retried: true });
    }
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
