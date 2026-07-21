import { createKorebApi } from '@koreb/api-client';
import { webTokenStorage } from './tokenStorage';

export const api = createKorebApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  tokenStorage: webTokenStorage,
  onSessionExpired: () => {
    if (typeof window !== 'undefined') window.location.href = '/signin';
  },
});
