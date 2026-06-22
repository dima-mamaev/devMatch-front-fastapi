/**
 * Throw at startup if a required env var is missing.
 *
 * Use this for ``NEXT_PUBLIC_*`` values that the app can't function
 * without — failing loudly at app boot beats the silent "site appears
 * broken in prod" outcome of falling back to a dev default.
 *
 * Next inlines ``NEXT_PUBLIC_*`` at build time, so a missing var causes
 * the first import-time evaluation to throw — which surfaces in the
 * browser console + the error boundary, not as a confusing connection
 * error later.
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local (dev) or your deployment env (Vercel).`,
    );
  }
  return value;
}
