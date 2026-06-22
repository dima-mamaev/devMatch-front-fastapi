import { setQueryParams } from "./api-utils";
import { getToken } from "./tokenStore";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

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
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const { method = "GET", params, headers, body, signal } = opts;
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

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
