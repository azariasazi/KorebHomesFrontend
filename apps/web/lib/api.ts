import { createKorebApi } from '@koreb/api-client';
import { webTokenStorage } from './tokenStorage';

/** Exported separately because photo URLs from the backend are relative and
 *  need this host prefixed onto them. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const api = createKorebApi({
  baseUrl: API_BASE_URL,
  tokenStorage: webTokenStorage,
  onSessionExpired: () => {
    if (typeof window === 'undefined') return;
    // A 401 has two very different meanings:
    //   1. Nobody is signed in (e.g. the public home feed calling /users/me to
    //      see who you are). This is normal — browsing is open to everyone — so
    //      we must NOT redirect, or signed-out visitors get bounced to signup.
    //   2. A real session that has now expired. Only here do we send the user
    //      to sign in again.
    // We tell them apart by whether a token actually exists: if there's no
    // stored token, the user was never signed in, so stay put.
    const hadToken =
      window.localStorage.getItem('koreb_access_token') ||
      window.localStorage.getItem('koreb_refresh_token');
    if (!hadToken) return;

    // Real expiry: clear the dead tokens and, only if we're on a page that
    // needs auth, send them to sign in. Public pages just re-render as signed-out.
    window.localStorage.removeItem('koreb_access_token');
    window.localStorage.removeItem('koreb_refresh_token');

    const path = window.location.pathname;
    const needsAuth =
      path.startsWith('/dashboard') ||
      path.startsWith('/admin') ||
      path.startsWith('/post-listing') ||
      path.startsWith('/favorites');
    if (needsAuth) window.location.href = '/signup';
  },
});
