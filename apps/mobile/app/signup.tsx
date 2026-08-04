import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useLang } from '@koreb/hooks';
import type { Role } from '@koreb/types';
import { ApiError } from '@koreb/api-client';
import { api } from '../lib/api';

const ROLES: { value: Role; titleKey: string; descKey: string }[] = [
  { value: 'BUYER_RENTER', titleKey: 'auth.roleBuyer', descKey: 'auth.roleBuyerDesc' },
  { value: 'OWNER', titleKey: 'auth.roleOwner', descKey: 'auth.roleOwnerDesc' },
  { value: 'AGENT', titleKey: 'auth.roleAgent', descKey: 'auth.roleAgentDesc' },
];

export default function SignUpScreen() {
  // Language now lives app-wide in KorebProvider.
  const { lang, toggleLang } = useLang();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState<Role>('BUYER_RENTER');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = `+251${phone.replace(/\D/g, '')}`;
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const nameReady = firstName.trim().length > 0 && lastName.trim().length > 0;

  async function handleSendCode() {
    setError(null);
    setLoading(true);
    try {
      await api.auth.requestOtp(fullPhone);
      setStep('code');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      await api.auth.verifyOtp({
        phone: fullPhone,
        code,
        role,
        ...(fullName ? { name: fullName } : {}),
      });
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.charcoal }}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Brand banner — the Addis Ababa night skyline with a dark scrim so the
          mark and headline stay readable over the city lights. Mirrors the web
          design's photo panel, adapted to a top banner for mobile. */}
      <ImageBackground
        source={require('../assets/brand-photo.jpg')}
        style={styles.banner}
        imageStyle={styles.bannerImg}
      >
        <View style={styles.bannerScrim} />
        <TouchableOpacity style={styles.langToggle} onPress={toggleLang}>
          <Text style={styles.langToggleText}>EN / አማ</Text>
        </TouchableOpacity>
        <View style={styles.bannerContent}>
          <Svg width={52} height={52} viewBox="0 0 40 40" style={{ marginBottom: 12 }}>
            <Polygon points="20,3 35,20 20,23 5,20" fill={colors.gold} />
            <Polygon points="20,23 35,20 20,37 5,20" fill={colors.green} />
            <Polygon points="20,3 27.5,11.5 20,13 12.5,11.5" fill={colors.goldTint} />
          </Svg>
          <Text style={styles.bannerTitle}>{t(lang, 'auth.welcomeTitle')}</Text>
          <Text style={styles.bannerSubtitle}>{t(lang, 'auth.welcomeSubtitle')}</Text>
        </View>
      </ImageBackground>

      <View style={{ padding: spacing.lg, paddingTop: spacing.xl }}>

      {step === 'phone' && (
        <>
          {/* Google sign-in — placed but disabled until the backend OAuth
              endpoint exists; shows a "Soon" tag rather than a dead button. */}
          <TouchableOpacity style={styles.socialBtn} disabled activeOpacity={1}>
            <View style={styles.gIcon}>
              <Text style={styles.gIconText}>G</Text>
            </View>
            <Text style={styles.socialBtnText}>{t(lang, 'auth.continueWithGoogle')}</Text>
            <View style={styles.soonTag}>
              <Text style={styles.soonTagText}>{t(lang, 'auth.comingSoon')}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t(lang, 'auth.orDivider')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Name — required for creating an account. */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t(lang, 'auth.firstName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t(lang, 'auth.firstNamePlaceholder')}
                placeholderTextColor="#5B6265"
                value={firstName}
                onChangeText={setFirstName}
                maxLength={40}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t(lang, 'auth.lastName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t(lang, 'auth.lastNamePlaceholder')}
                placeholderTextColor="#5B6265"
                value={lastName}
                onChangeText={setLastName}
                maxLength={40}
              />
            </View>
          </View>

          <Text style={styles.label}>{t(lang, 'auth.phoneNumber')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
            <View style={styles.codeBox}>
              <Text style={styles.codeBoxText}>+251</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="9 12 345 678"
              placeholderTextColor="#5B6265"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <TouchableOpacity
            style={[styles.goldButton, (loading || phone.length < 9 || !nameReady) && styles.disabled]}
            disabled={loading || phone.length < 9 || !nameReady}
            onPress={handleSendCode}
          >
            {loading ? (
              <ActivityIndicator color={colors.charcoal} />
            ) : (
              <Text style={styles.goldButtonText}>{t(lang, 'auth.sendCode')}</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: spacing.xl }]}>{t(lang, 'auth.iAmA')}</Text>
          <View style={{ gap: spacing.sm }}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[styles.roleCard, role === r.value && styles.roleCardSelected]}
              >
                <Text style={styles.roleTitle}>{t(lang, r.titleKey)}</Text>
                <Text style={styles.roleDesc}>{t(lang, r.descKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {step === 'code' && (
        <>
          <Text style={styles.label}>{t(lang, 'auth.enterCode')}</Text>
          <TextInput
            style={[styles.input, { textAlign: 'center', letterSpacing: 4, marginBottom: spacing.lg }]}
            placeholder="123456"
            placeholderTextColor="#5B6265"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <TouchableOpacity
            style={[styles.goldButton, (loading || code.length < 4) && styles.disabled]}
            disabled={loading || code.length < 4}
            onPress={handleVerify}
          >
            {loading ? (
              <ActivityIndicator color={colors.charcoal} />
            ) : (
              <Text style={styles.goldButtonText}>{t(lang, 'auth.verifyCode')}</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.disclaimer}>{t(lang, 'auth.disclaimer')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 11, paddingVertical: 13, paddingHorizontal: 16,
    marginBottom: spacing.md, opacity: 0.9,
  },
  gIcon: {
    width: 20, height: 20, borderRadius: 4, backgroundColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
  },
  gIconText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  socialBtnText: { color: '#14181A', fontWeight: '600', fontSize: 14 },
  soonTag: { backgroundColor: 'rgba(201,162,75,0.18)', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  soonTagText: { fontSize: 9.5, fontWeight: '700', color: '#8a7331', letterSpacing: 0.4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { color: '#7C8284', fontSize: 11.5, fontWeight: '600', letterSpacing: 0.5 },

  banner: { height: 260, justifyContent: 'flex-end' },
  bannerImg: { resizeMode: 'cover' },
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,24,26,0.45)',
  },
  bannerContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  bannerTitle: {
    color: colors.cream, fontSize: 26, fontWeight: '700', marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10,
  },
  bannerSubtitle: {
    color: 'rgba(246,243,236,0.9)', fontSize: 13.5, lineHeight: 19, maxWidth: 300,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  langToggle: {
    position: 'absolute', top: 44, right: spacing.lg,
    backgroundColor: 'rgba(20,24,26,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 2,
  },
  langToggleText: { color: colors.cream, fontSize: 11.5, fontWeight: '700' },
  title: { color: colors.cream, fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: '#A6ADB0', fontSize: 13, textAlign: 'center' },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#A6ADB0',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeBox: {
    width: 64,
    backgroundColor: colors.charcoalSoft,
    borderWidth: 1.4,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxText: { color: colors.cream, fontWeight: '600', fontSize: 14 },
  input: {
    flex: 1,
    backgroundColor: colors.charcoalSoft,
    borderWidth: 1.4,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    color: colors.cream,
    fontSize: 14.5,
  },
  goldButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  goldButtonText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
  roleCard: {
    borderWidth: 1.4,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: colors.charcoalSoft,
    borderRadius: radius.lg,
    padding: 14,
  },
  roleCardSelected: { borderColor: colors.gold, backgroundColor: 'rgba(201,162,75,0.10)' },
  roleTitle: { fontSize: 13.5, fontWeight: '700', color: colors.cream },
  roleDesc: { fontSize: 11, color: '#9AA0A2', marginTop: 2 },
  error: { color: '#E38585', fontSize: 12.5, textAlign: 'center', marginTop: spacing.md },
  disclaimer: { fontSize: 11, color: '#7C8284', textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
});
