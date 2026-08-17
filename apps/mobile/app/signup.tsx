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
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useLang } from '@koreb/hooks';
import type { Role } from '@koreb/types';
import { ApiError } from '@koreb/api-client';
import { api } from '../lib/api';
type SignupRole = Exclude<Role, 'ADMIN'>;

const ROLES: { value: SignupRole; titleKey: string; descKey: string }[] = [
  { value: 'BUYER_RENTER', titleKey: 'auth.roleBuyer', descKey: 'auth.roleBuyerDesc' },
  { value: 'OWNER', titleKey: 'auth.roleOwner', descKey: 'auth.roleOwnerDesc' },
  { value: 'AGENT', titleKey: 'auth.roleAgent', descKey: 'auth.roleAgentDesc' },
];

export default function SignUpScreen() {
  // ?mode=signup → create-account view; otherwise log-in. Auth is password-based:
  // signup collects details + verifies a code; login is identifier + password.
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSignup = mode === 'signup';
  const { lang, toggleLang } = useLang();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<SignupRole>('BUYER_RENTER');

  // login field
  const [identifier, setIdentifier] = useState('');

  // verify step
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('sms');
  const [sentTo, setSentTo] = useState('');

  const fullPhone = `+251${phone.replace(/\D/g, '')}`;

  const signupReady =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phone.replace(/\D/g, '').length >= 9 &&
    password.length >= 8;
  const loginReady = identifier.trim().length > 0 && password.length > 0;

  async function handleSignup() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: fullPhone,
        password,
        role,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      setUserId(res.userId);
      setChannel(res.channel);
      setSentTo(res.sentTo);
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
      if (channel === 'email') {
        await api.auth.verifyEmail({ userId, code });
      } else {
        await api.auth.verifyPhoneSignup({ userId, code });
      }
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await api.auth.login({ identifier: identifier.trim(), password });
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not sign you in. Check your details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.charcoal }}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
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

      {/* ============ SIGNUP — details form ============ */}
      {isSignup && step === 'form' && (
        <>
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
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
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

          <Text style={styles.label}>{t(lang, 'auth.emailOptional')}</Text>
          <TextInput
            style={[styles.input, { marginBottom: spacing.md }]}
            placeholder={t(lang, 'auth.emailPlaceholder')}
            placeholderTextColor="#5B6265"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>{t(lang, 'auth.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t(lang, 'auth.passwordPlaceholder')}
            placeholderTextColor="#5B6265"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Text style={styles.hint}>{t(lang, 'auth.passwordHint')}</Text>

          <TouchableOpacity
            style={[styles.goldButton, (loading || !signupReady) && styles.disabled]}
            disabled={loading || !signupReady}
            onPress={handleSignup}
          >
            {loading ? (
              <ActivityIndicator color={colors.charcoal} />
            ) : (
              <Text style={styles.goldButtonText}>{t(lang, 'auth.createAccount')}</Text>
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

      {/* ============ LOGIN — identifier + password ============ */}
      {!isSignup && step === 'form' && (
        <>
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

          <Text style={styles.label}>{t(lang, 'auth.identifier')}</Text>
          <TextInput
            style={[styles.input, { marginBottom: spacing.md }]}
            placeholder={t(lang, 'auth.identifierPlaceholder')}
            placeholderTextColor="#5B6265"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />

          <Text style={styles.label}>{t(lang, 'auth.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t(lang, 'auth.passwordPlaceholder')}
            placeholderTextColor="#5B6265"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => router.push('/forgot-password')} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
            <Text style={styles.forgotLink}>{t(lang, 'auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.goldButton, (loading || !loginReady) && styles.disabled, { marginTop: spacing.md }]}
            disabled={loading || !loginReady}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator color={colors.charcoal} />
            ) : (
              <Text style={styles.goldButtonText}>{t(lang, 'auth.logIn')}</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* ============ VERIFY — code step (signup only) ============ */}
      {step === 'code' && (
        <>
          <Text style={styles.sentNote}>
            {t(lang, channel === 'email' ? 'auth.codeSentEmail' : 'auth.codeSentSms', { target: sentTo })}
          </Text>
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
          <TouchableOpacity onPress={() => setStep('form')} style={{ marginTop: 14 }}>
            <Text style={styles.backLink}>← {t(lang, 'common.back')}</Text>
          </TouchableOpacity>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {step === 'form' && (
        <Text style={styles.switchMode}>
          {isSignup ? t(lang, 'auth.haveAccountPrompt') : t(lang, 'auth.noAccountPrompt')}{' '}
          <Text
            style={styles.switchModeLink}
            onPress={() => router.setParams({ mode: isSignup ? undefined : 'signup' })}
          >
            {isSignup ? t(lang, 'auth.logInLink') : t(lang, 'auth.signUpLink')}
          </Text>
        </Text>
      )}

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
  backLink: { color: '#A6ADB0', fontSize: 12.5, textAlign: 'center' },
  switchMode: { color: '#A6ADB0', fontSize: 13, textAlign: 'center', marginTop: spacing.lg },
  switchModeLink: { color: colors.gold, fontWeight: '600' },
  disclaimer: { fontSize: 11, color: '#7C8284', textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
  hint: { fontSize: 11, color: '#7C8284', marginTop: 6, marginBottom: 2 },
  forgotLink: { color: colors.gold, fontSize: 12.5, fontWeight: '600' },
  sentNote: { color: '#A6ADB0', fontSize: 12.5, textAlign: 'center', marginBottom: spacing.md, lineHeight: 18 },
});
