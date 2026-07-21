import { ApiClient, ApiError } from './client';
import type { ApiClientConfig } from './client';
import { createAuthApi } from './auth';
import { createUsersApi } from './users';
import { createListingsApi } from './listings';
import { createPhotosApi } from './photos';
import { createFavoritesApi } from './favorites';
import { createPaymentsApi } from './payments';
import { createAdminApi } from './admin';

export { ApiError } from './client';
export type { ApiClientConfig, RequestOptions } from './client';
export type { TokenStorage } from './tokenStorage';
export { createInMemoryTokenStorage } from './tokenStorage';

/**
 * The one function each app calls at startup.
 *
 * Example (web, server or client component setup):
 *   const api = createKorebApi({
 *     baseUrl: process.env.NEXT_PUBLIC_API_URL!,
 *     tokenStorage: webTokenStorage,
 *     onSessionExpired: () => router.push('/signin'),
 *   });
 *
 * Example (mobile, e.g. in an AuthProvider):
 *   const api = createKorebApi({
 *     baseUrl: Constants.expoConfig.extra.apiUrl,
 *     tokenStorage: secureStoreTokenStorage,
 *     onSessionExpired: () => navigation.replace('SignIn'),
 *   });
 */
export function createKorebApi(config: ApiClientConfig) {
  const client = new ApiClient(config);

  return {
    auth: createAuthApi(client, config.tokenStorage),
    users: createUsersApi(client),
    listings: createListingsApi(client),
    photos: createPhotosApi(client),
    favorites: createFavoritesApi(client),
    payments: createPaymentsApi(client),
    admin: createAdminApi(client),
  };
}

export type KorebApi = ReturnType<typeof createKorebApi>;
