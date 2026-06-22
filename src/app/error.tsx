"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Next.js auto-mounts this as an error boundary around every segment below
 * the root layout. Activated when a client- or server-component render
 * throws.
 *
 * The ``reset`` callback re-runs the segment's render; we surface it as a
 * "Try again" button so transient errors (a flaky network blip, a stale
 * cached query) can be recovered without a full page reload.
 *
 * The root layout (Toaster, providers) stays mounted — so error reporting
 * and toasts still work. For catastrophic root-layout errors, see
 * ``global-error.tsx``.
 */
export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort log so the error isn't lost. In prod this is where a
    // Sentry / structlog hook would go.
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">
          Something went wrong
        </h1>
        <p className="text-sm text-slate-500">
          We hit an unexpected error. You can try again, or head back to
          the home page.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={() => reset()}>
            Try again
          </Button>
          <Button variant="ghost-muted" size="md" href="/">
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
