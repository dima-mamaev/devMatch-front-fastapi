"use client";

/**
 * Last-resort error boundary — catches errors thrown by the ROOT layout
 * itself (Auth0Provider, ApiProvider, etc.). When this activates, the
 * normal root layout's html/body wrappers haven't rendered, so this file
 * MUST include its own ``<html>`` and ``<body>`` tags per Next.js
 * App Router convention.
 *
 * Almost never fires in practice — segment-level ``error.tsx`` catches
 * everything below the root. Keeping this as a backstop so we never serve
 * a totally blank page.
 */
export default function GlobalRootError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">
              The app failed to start
            </h1>
            <p className="text-sm text-slate-500">
              We hit a critical error before the app could render. Try
              reloading; if that doesn&apos;t help, the backend may be
              unreachable.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => reset()}
                className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
