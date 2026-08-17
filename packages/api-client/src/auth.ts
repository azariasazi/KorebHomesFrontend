import type { ApiClient } from './client';
import type { TokenStorage } from './tokenStorage';
import type { CurrentUser, Role } from '@koreb/types';

/** What signup returns: the account is created unverified and a code is sent. */
export interface SignupResponse {
  message: string;
  userId: string;
  channel: 'email' | 'sms';
  sentTo: string; // masked, e.g. "d****@example.com"
  expiresInSeconds: number;
  verifyPurpose: 'EMAIL_VERIFY' | 'PHONE_VERIFY';
}

/** The signed-in payload returned by verify/login/google. */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
  /** Present on Google sign-in: true when the user still needs to add a phone. */
  needsPhone?: boolean;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  email?: string;
  role?: Exclude<Role, 'ADMIN'>;
}

/**
 * Takes the same tokenStorage the client was configured with, so
 * verify/login/logout can write/clear tokens directly — screens never touch
 * storage themselves.
 *
 * CR07: auth is now password-based. Signup creates an unverified account and
 * sends a code (email if given, else SMS); verifying it logs the user in.
 * Login is identifier (phone OR email) + password.
 */
export function createAuthApi(client: ApiClient, tokenStorage: TokenStorage) {
  /** Shared: save the returned token pair after any successful auth call. */
  async function persist(result: AuthSession) {
    await tokenStorage.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  return {
    // ---- Signup ----

    /** Create an account (unverified). Returns how the code was sent + a userId. */
    signup(input: SignupInput) {
      return client.request<SignupResponse>('/auth/signup', {
        method: 'POST',
        body: input,
        authenticated: false,
      });
    },

    /** Confirm an email-verification code (email-first signup) -> logs in. */
    async verifyEmail(params: { userId: string; code: string }) {
      const result = await client.request<AuthSession>('/auth/verify-email', {
        method: 'POST',
        body: params,
        authenticated: false,
      });
      return persist(result);
    },

    /** Confirm an SMS code for a phone-only signup (no email given) -> logs in. */
    async verifyPhoneSignup(params: { userId: string; code: string }) {
      const result = await client.request<AuthSession>('/auth/verify-phone-signup', {
        method: 'POST',
        body: params,
        authenticated: false,
      });
      return persist(result);
    },

    // ---- Login ----

    /** Sign in with phone-or-email + password. */
    async login(params: { identifier: string; password: string }) {
      const result = await client.request<AuthSession>('/auth/login', {
        method: 'POST',
        body: params,
        authenticated: false,
      });
      return persist(result);
    },

    /** "Continue with Google." Returns a session + needsPhone. */
    async google(idToken: string) {
      const result = await client.request<AuthSession>('/auth/google', {
        method: 'POST',
        body: { idToken },
        authenticated: false,
      });
      return persist(result);
    },

    // ---- Password recovery ----

    /** Send a reset code to the account's email (if verified) else SMS. Always
        returns the same generic message - no account enumeration. */
    forgotPassword(identifier: string) {
      return client.request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { identifier },
        authenticated: false,
      });
    },

    /** Set a new password with the reset code. Revokes all existing sessions. */
    resetPassword(params: { identifier: string; code: string; newPassword: string }) {
      return client.request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: params,
        authenticated: false,
      });
    },

    /** Logged-in user changing their own password. */
    changePassword(params: { currentPassword: string; newPassword: string }) {
      return client.request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: params,
      });
    },

    // ---- Phone verification (email-first / Google users, before posting) ----

    /** Request an SMS code to verify (or change) the logged-in user's phone. */
    requestPhone(phone: string) {
      return client.request<{ message: string; expiresInSeconds: number }>('/auth/phone/request', {
        method: 'POST',
        body: { phone },
      });
    },

    /** Confirm the SMS code, saving the phone as verified. */
    verifyPhone(code: string) {
      return client.request<{ message: string }>('/auth/phone/verify', {
        method: 'POST',
        body: { code },
      });
    },

    // ---- Email change (verify new address before saving) ----

    requestEmail(email: string) {
      return client.request<{ message: string; expiresInSeconds: number }>('/auth/email/request', {
        method: 'POST',
        body: { email },
      });
    },

    verifyEmailChange(code: string) {
      return client.request<{ message: string }>('/auth/email/verify', {
        method: 'POST',
        body: { code },
      });
    },

    // ---- Session ----

    /** Reads the refresh token from storage, calls the backend, clears storage either way. */
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
