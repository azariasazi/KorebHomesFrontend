/**
 * The web app and mobile app store tokens differently:
 *  - web: a secure storage mechanism the Next.js app wires up (e.g. httpOnly cookie set via a route handler)
 *  - mobile: expo-secure-store
 *
 * Rather than the api-client assuming one or the other, each app hands it
 * an object matching this interface when the client is created. This keeps
 * @koreb/api-client platform-agnostic — it never imports React Native or
 * Next.js code directly.
 */
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearTokens(): Promise<void>;
}

/** Simple in-memory fallback — useful for tests, never for production. */
export function createInMemoryTokenStorage(): TokenStorage {
  let access: string | null = null;
  let refresh: string | null = null;
  return {
    async getAccessToken() {
      return access;
    },
    async getRefreshToken() {
      return refresh;
    },
    async setTokens(a, r) {
      access = a;
      refresh = r;
    },
    async clearTokens() {
      access = null;
      refresh = null;
    },
  };
}
