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
import { router } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useLang } from '@koreb/hooks';
import { ApiError } from '@koreb/api-client';
import { api } from '../lib/api';

export default function ForgotPasswordScreen() {
  const { lang } = useLang();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setError(null);
    setLoading(true);
    try {
      await api.auth.forgotPassword(identifier.trim());
      setStep('reset');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setError(null);
    setLoading(true);
    try {
      await api.auth.resetPassword({ identifier: identifier.trim(), code, newPassword });
      setStep('done');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reset. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.charcoal }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 70, paddingBottom: 60 }}
    >
      <TouchableOpacity onPress={() => router.replace('/signup')} style={{ marginBottom: spacing.lg }}>
        <Text style={styles.backLink}>← {t(lang, 'auth.backToLogin')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t(lang, 'auth.forgotTitle')}</Text>

      {step === 'request' && (
        <>
          <Text style={styles.sentNote}>{t(lang, 'auth.forgotSubtitle')}</Text>
          <Text style={styles.label}>{t(lang, 'auth.identifier')}</Text>
          <TextInput
            style={[styles.input, { marginBottom: spacing.lg }]}
            placeholder={t(lang, 'auth.identifierPlaceholder')}
            placeholderTextColor="#5B6265"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <TouchableOpacity
            style={[styles.goldButton, (loading || identifier.trim().length < 3) && styles.disabled]}
            disabled={loading || identifier.trim().length < 3}
            onPress={handleRequest}
          >
            {loading ? (
              <ActivityIndicator color={colors.charcoal} />
            ) : (
              <Text style={styles.goldButtonText}>{t(lang, 'auth.sendResetCode')}</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {step === 'reset' && (
        <>
          <Text style={styles.sentNote}>{t(lang, 'auth.resetSubtitle')}</Text>
          <Text style={styles.label}>{t(lang, 'auth.enterCode')}</Text>
          <TextInput
            style={[styles.input, { textAlign: 'center', letterSpacing: 4, marginBottom: spacing.md }]}
            placeholder="123456"
            placeholderTextColor="#5B6265"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <Text style={styles.label}>{t(lang, 'auth.newPassword')}</Text>
          <TextInput
            style={[styles.input, { marginBottom: spacing.lg }]}
            placeholder={t(lang, 'auth.passwordPlaceholder')}
            placeholderTextColor="#5B6265"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            style={[styles.goldButton, (loading || code.length < 4 || newPassword.length < 8) && styles.disabled]}
            disabled={loading || code.length < 4 || newPassword.length < 8}
            onPress={handleReset}
          >
            {loading ? (
              <ActivityIndicator color={colors.charcoal} />
            ) : (
              <Text style={styles.goldButtonText}>{t(lang, 'auth.resetPasswordBtn')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('request')} style={{ marginTop: 14 }}>
            <Text style={styles.backLink}>← {t(lang, 'common.back')}</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'done' && (
        <>
          <Text style={styles.sentNote}>{t(lang, 'auth.resetDone')}</Text>
          <TouchableOpacity style={styles.goldButton} onPress={() => router.replace('/signup')}>
            <Text style={styles.goldButtonText}>{t(lang, 'auth.logIn')}</Text>
          </TouchableOpacity>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.cream, fontSize: 24, fontWeight: '700', marginBottom: 10 },
  sentNote: { color: '#A6ADB0', fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  label: {
    fontSize: 11.5, fontWeight: '600', color: '#A6ADB0', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.charcoalSoft, borderWidth: 1.4, borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 14, color: colors.cream, fontSize: 14.5,
  },
  goldButton: {
    backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  goldButtonText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
  backLink: { color: '#A6ADB0', fontSize: 12.5 },
  error: { color: '#E38585', fontSize: 12.5, textAlign: 'center', marginTop: spacing.md },
});
