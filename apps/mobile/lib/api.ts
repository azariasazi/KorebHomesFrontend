import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
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
    // A 401 has two very different meanings (same distinction the web app
    // makes in apps/web/lib/api.ts):
    //   1. Nobody is signed in (e.g. the public home feed calling /users/me
    //      to see who's browsing). Normal — browsing is open to everyone —
    //      so we must NOT redirect, or signed-out visitors get bounced back
    //      to sign-up mid-browse.
    //   2. A real session that has now expired. Only here do we send the
    //      user back to sign in.
    // We tell them apart by whether a token actually existed.
    (async () => {
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync('koreb_access_token'),
        SecureStore.getItemAsync('koreb_refresh_token'),
      ]);
      if (!access && !refresh) return; // never signed in — stay put
      await mobileTokenStorage.clearTokens();
      router.replace('/signup');
    })();
  },
});
