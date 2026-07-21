import type { ApiClient } from './client';
import type { TokenStorage } from './tokenStorage';
import type { CurrentUser, Role } from '@koreb/types';

export interface OtpRequestResponse {
  message: string;
  expiresInSeconds: number;
}

export interface OtpVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; phone: string; role: Role };
}

/** Takes the same tokenStorage the client was configured with, so verify/logout can write/clear tokens directly — screens never have to touch storage themselves. */
export function createAuthApi(client: ApiClient, tokenStorage: TokenStorage) {
  return {
    /** Rate-limited ~3/min on the backend — surface a friendly message if the user hits that. */
    requestOtp(phone: string) {
      return client.request<OtpRequestResponse>('/auth/otp/request', {
        method: 'POST',
        body: { phone },
        authenticated: false,
      });
    },

    /** Pass `role`/`name` only on first-time signup; omit both for a returning-user login. Saves tokens on success. */
    async verifyOtp(params: { phone: string; code: string; role?: Role; name?: string }) {
      const result = await client.request<OtpVerifyResponse>('/auth/otp/verify', {
        method: 'POST',
        body: params,
        authenticated: false,
      });
      await tokenStorage.setTokens(result.accessToken, result.refreshToken);
      return result;
    },

    /** Reads the refresh token from storage itself, calls the backend, then clears storage either way. */
    async logout() {
      const refreshToken = await tokenStorage.getRefreshToken();
      try {
        if (refreshToken) {
          await client.request<{ message: string }>('/auth/logout', {
            method: 'POST',
            body: { refreshToken },
          });
        }
      } finally {
        await tokenStorage.clearTokens();
      }
    },

    me() {
      return client.request<CurrentUser>('/users/me');
    },
  };
}
