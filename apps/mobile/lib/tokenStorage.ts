import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@koreb/api-client';

const ACCESS_KEY = 'koreb_access_token';
const REFRESH_KEY = 'koreb_refresh_token';

/**
 * expo-secure-store keeps values in the device's encrypted keychain
 * (Keychain on iOS, Keystore on Android) — this is the right place for
 * tokens on mobile, unlike web's temporary localStorage approach.
 */
export const mobileTokenStorage: TokenStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setTokens(access, refresh) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
