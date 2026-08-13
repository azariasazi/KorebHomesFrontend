import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KorebProvider } from '@koreb/hooks';
import { colors } from '@koreb/design-tokens';
import { api, API_BASE_URL } from '../lib/api';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'PlayfairDisplay-SemiBold': require('../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
      'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
      'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
      'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
      'NotoSansEthiopic-Regular': require('../assets/fonts/NotoSansEthiopic-Regular.ttf'),
    })
      .then(() => setFontsLoaded(true))
      // Fonts are a nice-to-have, not a blocker — fall back to system font
      // rather than leaving the user stuck on a spinner if a file is missing.
      .catch(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.charcoal }}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <KorebProvider api={api} apiBaseUrl={API_BASE_URL}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="home" />
          <Stack.Screen name="post-listing" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="account" />
          <Stack.Screen name="search-filters" options={{ presentation: 'modal' }} />
          <Stack.Screen name="listing/[id]" />
        </Stack>
      </KorebProvider>
    </SafeAreaProvider>
  );
}
