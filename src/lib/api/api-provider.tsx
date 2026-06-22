"use client";

import {
  QueryClient,
  QueryClientProvider,
  type QueryFunctionContext,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";

import { ApiContext } from "./api-context";
import { ApiError, apiFetch, unwrapDetail } from "./api-fetch";
import { setTokenGetter } from "./tokenStore";
import type { MutationVariables } from "./types";

export { API_BASE_URL, ApiError, apiFetch, unwrapDetail } from "./api-fetch";

export function ApiProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  // Install the token getter synchronously during render so it is in place
  // before any child's render-time useQuery fires. Idempotent — safe to re-run.
  setTokenGetter(
    isAuthenticated
      ? async () => {
          try {
            return await getAccessTokenSilently();
          } catch {
            return null;
          }
        }
      : null,
  );

  const queryFn = useCallback(({ queryKey, signal }: QueryFunctionContext) => {
    const [path, params] = queryKey as [string, unknown];
    return apiFetch(path, { params, signal });
  }, []);

  const mutationFn = useCallback(
    ({ path, method, headers, body }: MutationVariables) =>
      apiFetch(path, { method: method ?? "POST", headers, body }),
    [],
  );

  const onError = useCallback((error: Error) => {
    const message =
      error instanceof ApiError
        ? unwrapDetail(error.detail) || error.message
        : error.message || "Request failed";
    toast.error(message);
    return false;
  }, []);

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            queryFn,
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error) => {
              const status = (error as { status?: number })?.status;
              if (status === 401 || status === 403 || status === 404) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  const ctx = useMemo(() => ({ mutationFn, onError }), [mutationFn, onError]);

  return (
    <ApiContext.Provider value={ctx}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ApiContext.Provider>
  );
}
