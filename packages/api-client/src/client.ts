import type { ApiErrorShape } from '@koreb/types';
import type { TokenStorage } from './tokenStorage';

export class ApiError extends Error {
  statusCode: number;
  path: string;
  constructor(shape: ApiErrorShape) {
    super(Array.isArray(shape.message) ? shape.message.join(', ') : shape.message);
    this.statusCode = shape.statusCode;
    this.path = shape.path;
    this.name = 'ApiError';
  }
}

export interface ApiClientConfig {
  /** e.g. "http://localhost:3000/api/v1" in dev, the production host in prod. */
  baseUrl: string;
  tokenStorage: TokenStorage;
  /** Called when a refresh attempt itself fails — the app should route the user to Sign In. */
  onSessionExpired?: () => void;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set true for endpoints marked 🔒 in the API reference. Default true — most calls need auth. */
  authenticated?: boolean;
  /** Skip JSON body handling — used for multipart photo uploads. */
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildQueryString(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

export class ApiClient {
  private baseUrl: string;
  private tokenStorage: TokenStorage;
  private onSessionExpired?: () => void;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.tokenStorage = config.tokenStorage;
    this.onSessionExpired = config.onSessionExpired;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, authenticated = true, formData, query } = options;
    const url = `${this.baseUrl}${path}${buildQueryString(query)}`;

    const doFetch = async (): Promise<Response> => {
      const headers: Record<string, string> = {};
      if (!formData) headers['Content-Type'] = 'application/json';

      if (authenticated) {
        const token = await this.tokenStorage.getAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      return fetch(url, {
        method,
        headers,
        body: formData ?? (body ? JSON.stringify(body) : undefined),
      });
    };

    let response = await doFetch();

    // Access tokens live ~15 min (per API-REFERENCE.md). On a 401, try exactly
    // one silent refresh-and-retry before giving up — this is what keeps
    // users from getting logged out mid-session for no visible reason.
    if (response.status === 401 && authenticated) {
      const refreshed = await this.refreshTokenOnce();
      if (refreshed) {
        response = await doFetch();
      } else {
        this.onSessionExpired?.();
      }
    }

    if (!response.ok) {
      let shape: ApiErrorShape;
      try {
        shape = await response.json();
      } catch {
        shape = {
          statusCode: response.status,
          message: response.statusText || 'Request failed',
          error: 'Error',
          path,
          timestamp: new Date().toISOString(),
        };
      }
      throw new ApiError(shape);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  /** Ensures concurrent 401s only trigger ONE refresh call, not one per failed request. */
  private async refreshTokenOnce(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const refreshToken = await this.tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) throw new Error('Refresh failed');

        const data = await res.json();
        await this.tokenStorage.setTokens(data.accessToken, data.refreshToken);
      })();
    }

    try {
      await this.refreshPromise;
      return true;
    } catch {
      await this.tokenStorage.clearTokens();
      return false;
    } finally {
      this.refreshPromise = null;
    }
  }
}
