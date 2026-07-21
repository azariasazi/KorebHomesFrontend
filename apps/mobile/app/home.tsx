import { View, Text } from 'react-native';
import { colors, fontFamily } from '@koreb/design-tokens';

export default function HomePlaceholder() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text style={{ fontFamily: fontFamily.heading, fontSize: 18, color: colors.charcoal, textAlign: 'center' }}>
        You're signed in — Home Feed screen is built next.
      </Text>
    </View>
  );
}
