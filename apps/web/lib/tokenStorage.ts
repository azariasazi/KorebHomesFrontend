import type { TokenStorage } from '@koreb/api-client';

const ACCESS_KEY = 'koreb_access_token';
const REFRESH_KEY = 'koreb_refresh_token';

/**
 * Starter implementation using localStorage so the app is functional today.
 *
 * Before real launch, we should move this to httpOnly cookies set by a
 * Next.js route handler (apps/web/app/api/auth/*) — that protects tokens
 * from being readable by any injected/malicious JS in the page, which
 * localStorage cannot. Flagging this now so it isn't forgotten; the
 * TokenStorage interface means swapping it later won't touch any screen code.
 */
export const webTokenStorage: TokenStorage = {
  async getAccessToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  async getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  async setTokens(access, refresh) {
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  async clearTokens() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
