import { colors, fontFamily } from '@koreb/design-tokens';

export default function HomePlaceholder() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: colors.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p style={{ fontFamily: fontFamily.heading, fontSize: 20, color: colors.charcoal }}>
        You're signed in — Home Feed screen is built next.
      </p>
    </main>
  );
}
