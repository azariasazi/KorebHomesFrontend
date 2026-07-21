import type { ApiClient } from './client';
import type { CurrentUser, PublicUserCard } from '@koreb/types';

export function createUsersApi(client: ApiClient) {
  return {
    me() {
      return client.request<CurrentUser>('/users/me');
    },

    updateMe(input: { name?: string; city?: string; profilePhotoUrl?: string }) {
      return client.request<CurrentUser>('/users/me', { method: 'PATCH', body: input });
    },

    /** AGENT role only on the backend — calling this as another role will 403. */
    submitVerification(input: { documentUrl: string; agencyName: string; note?: string }) {
      return client.request<{ message: string }>('/users/me/verification', {
        method: 'POST',
        body: input,
      });
    },

    publicCard(userId: string) {
      return client.request<PublicUserCard>(`/users/${userId}/public`, {
        authenticated: false,
      });
    },
  };
}
