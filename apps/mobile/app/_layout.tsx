import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@koreb/design-tokens';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.charcoal }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="home" />
    </Stack>
  );
}
