import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t, type Language } from '@koreb/i18n';
import type { Role } from '@koreb/types';
import { ApiError } from '@koreb/api-client';
import { api } from '../lib/api';

const ROLES: { value: Role; titleKey: string; descKey: string }[] = [
  { value: 'BUYER_RENTER', titleKey: 'auth.roleBuyer', descKey: 'auth.roleBuyerDesc' },
  { value: 'OWNER', titleKey: 'auth.roleOwner', descKey: 'auth.roleOwnerDesc' },
  { value: 'AGENT', titleKey: 'auth.roleAgent', descKey: 'auth.roleAgentDesc' },
];

export default function SignUpScreen() {
  const [lang, setLang] = useState<Language>('en');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState<Role>('BUYER_RENTER');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = `+251${phone.replace(/\D/g, '')}`;

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
      await api.auth.verifyOtp({ phone: fullPhone, code, role });
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
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 60, paddingBottom: 60 }}
    >
      <TouchableOpacity
        style={styles.langToggle}
        onPress={() => setLang(lang === 'en' ? 'am' : 'en')}
      >
        <Text style={styles.langToggleText}>EN / አማ</Text>
      </TouchableOpacity>

      <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
        <Svg width={56} height={56} viewBox="0 0 40 40" style={{ marginBottom: 14 }}>
          <Polygon points="20,3 35,20 20,23 5,20" fill={colors.gold} />
          <Polygon points="20,23 35,20 20,37 5,20" fill={colors.green} />
          <Polygon points="20,3 27.5,11.5 20,13 12.5,11.5" fill={colors.goldTint} />
        </Svg>
        <Text style={styles.title}>{t(lang, 'auth.welcomeTitle')}</Text>
        <Text style={styles.subtitle}>{t(lang, 'auth.welcomeSubtitle')}</Text>
      </View>

      {step === 'phone' && (
        <>
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
            style={[styles.goldButton, (loading || phone.length < 9) && styles.disabled]}
            disabled={loading || phone.length < 9}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  langToggle: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
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
