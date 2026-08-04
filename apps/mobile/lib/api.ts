import Constants from 'expo-constants';
import { createKorebApi } from '@koreb/api-client';
import { mobileTokenStorage } from './tokenStorage';
import { router } from 'expo-router';

/** Exported separately because photo URLs from the backend are relative and
 *  need this host prefixed onto them. */
export const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3000/api/v1';

export const api = createKorebApi({
  baseUrl: API_BASE_URL,
  tokenStorage: mobileTokenStorage,
  onSessionExpired: () => {
    router.replace('/signup');
  },
});
