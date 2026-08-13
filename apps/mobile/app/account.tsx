import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useKoreb, useMe, useLogout } from '@koreb/hooks';

/**
 * The mobile equivalent of the web app's account dropdown (SiteHeader.tsx) —
 * shows who's signed in and gives every role (not just Owner/Agent) a way to
 * sign out. Reached from the "Account" tab in the bottom nav.
 */
export default function AccountScreen() {
  const { lang } = useKoreb();
  const { data: me, isLoading } = useMe();
  const logout = useLogout();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!me) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>{t(lang, 'auth.myAccount')}</Text>
        <TouchableOpacity style={styles.goldBtn} onPress={() => router.push('/signup')}>
          <Text style={styles.goldBtnText}>{t(lang, 'auth.logInLink')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = me.name || me.agencyName || t(lang, 'auth.myAccount');
  const initial = (displayName || '?').trim().charAt(0).toUpperCase();

  async function handleLogout() {
    await logout.mutateAsync();
    router.replace('/home');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.role}>{t(lang, `roles.${me.role}`)}</Text>
      </View>

      <View style={styles.menu}>
        {(me.role === 'OWNER' || me.role === 'AGENT') && (
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/dashboard')}>
            <Text style={styles.menuItemText}>{t(lang, 'dashboard.title')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/favorites')}>
          <Text style={styles.menuItemText}>{t(lang, 'favorites.title')}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout} disabled={logout.isPending}>
          <Text style={styles.signOutText}>
            {logout.isPending ? t(lang, 'common.loading') : t(lang, 'auth.signOut')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.cream },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: spacing.xl },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: colors.charcoal, fontSize: 24, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: colors.charcoal },
  role: { fontSize: 12.5, color: '#8A9093', marginTop: 2 },
  menu: { paddingHorizontal: spacing.lg },
  menuItem: {
    backgroundColor: '#fff', borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 16,
    marginBottom: 10,
  },
  menuItemText: { fontSize: 14.5, fontWeight: '600', color: colors.charcoal },
  signOutText: { fontSize: 14.5, fontWeight: '600', color: '#C0392B' },
  divider: { height: 8 },
  stateTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal, marginBottom: 18, textAlign: 'center' },
  goldBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 22 },
  goldBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
});
