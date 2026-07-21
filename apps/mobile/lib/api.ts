import Constants from 'expo-constants';
import { createKorebApi } from '@koreb/api-client';
import { mobileTokenStorage } from './tokenStorage';
import { router } from 'expo-router';

const apiUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3000/api/v1';

export const api = createKorebApi({
  baseUrl: apiUrl,
  tokenStorage: mobileTokenStorage,
  onSessionExpired: () => {
    router.replace('/signup');
  },
});
