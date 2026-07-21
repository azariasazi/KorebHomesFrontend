import type { ApiClient } from './client';
import type { Listing } from '@koreb/types';

export interface FavoriteEntry {
  listing: Listing;
  favoritedAt: string;
}

export function createFavoritesApi(client: ApiClient) {
  return {
    /** LIVE favorited listings only, each with its first photo — powers the Favorites screen. */
    list() {
      return client.request<FavoriteEntry[]>('/favorites');
    },

    /** Idempotent — safe to call even if already favorited. */
    add(listingId: string) {
      return client.request<{ message: string }>(`/favorites/${listingId}`, { method: 'POST' });
    },

    /** Idempotent — safe to call even if not currently favorited. */
    remove(listingId: string) {
      return client.request<{ message: string }>(`/favorites/${listingId}`, { method: 'DELETE' });
    },
  };
}
