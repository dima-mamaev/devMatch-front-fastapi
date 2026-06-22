/**
 * Pure-module bridge between Auth0 (which only exposes its API via React
 * context) and ``apiFetch`` (which runs outside React). ``ApiProvider``
 * registers the Auth0 callbacks here at mount; ``apiFetch`` reads them.
 *
 * Two callables live here:
 *
 *   - ``tokenGetter`` — returns the current access token (cached).
 *     Called on every request to populate the ``Authorization`` header.
 *
 *   - ``tokenRefresher`` — forces Auth0 to fetch a fresh token via the
 *     silent-renewal flow. Called by ``apiFetch`` exactly once after a
 *     401, before retrying the original request.
 */

type Getter = () => Promise<string | null>;

let currentGetter: Getter | null = null;
let currentRefresher: Getter | null = null;

export function setTokenGetter(fn: Getter | null) {
  currentGetter = fn;
}

export function setTokenRefresher(fn: Getter | null) {
  currentRefresher = fn;
}

export async function getToken(): Promise<string | null> {
  if (!currentGetter) return null;
  try {
    return await currentGetter();
  } catch {
    return null;
  }
}

/**
 * Force a fresh access token from Auth0 (ignoring the SDK's cached one).
 * Returns ``null`` if no refresher is registered or the refresh failed
 * (e.g. the user's Auth0 session itself expired) — caller should surface
 * the original 401 to the user in that case.
 */
export async function refreshToken(): Promise<string | null> {
  if (!currentRefresher) return null;
  try {
    return await currentRefresher();
  } catch {
    return null;
  }
}
