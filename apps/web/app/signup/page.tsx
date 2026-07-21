'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, fontFamily, radius, spacing } from '@koreb/design-tokens';
import { t, type Language } from '@koreb/i18n';
import type { Role } from '@koreb/types';
import { api } from '../../lib/api';
import { ApiError } from '@koreb/api-client';

const ROLES: { value: Role; titleKey: string; descKey: string }[] = [
  { value: 'BUYER_RENTER', titleKey: 'auth.roleBuyer', descKey: 'auth.roleBuyerDesc' },
  { value: 'OWNER', titleKey: 'auth.roleOwner', descKey: 'auth.roleOwnerDesc' },
  { value: 'AGENT', titleKey: 'auth.roleAgent', descKey: 'auth.roleAgentDesc' },
];

export default function SignUpPage() {
  const router = useRouter();
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
      router.push('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: colors.charcoal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.md }}>
          <button
            onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: radius.pill,
              color: colors.cream,
              padding: '6px 12px',
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            EN / አማ
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          <svg width="56" height="56" viewBox="0 0 40 40" style={{ margin: '0 auto 14px' }}>
            <polygon points="20,3 35,20 20,23 5,20" fill={colors.gold} />
            <polygon points="20,23 35,20 20,37 5,20" fill={colors.green} />
            <polygon points="20,3 27.5,11.5 20,13 12.5,11.5" fill={colors.goldTint} />
          </svg>
          <h1
            style={{
              fontFamily: lang === 'am' ? fontFamily.amharic : fontFamily.heading,
              color: colors.cream,
              fontSize: 22,
              margin: '0 0 6px',
            }}
          >
            {t(lang, 'auth.welcomeTitle')}
          </h1>
          <p style={{ color: '#A6ADB0', fontSize: 13, margin: 0 }}>
            {t(lang, 'auth.welcomeSubtitle')}
          </p>
        </div>

        {step === 'phone' && (
          <>
            <div style={labelStyle}>{t(lang, 'auth.phoneNumber')}</div>
            <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg }}>
              <div style={codeBoxStyle}>+251</div>
              <input
                style={inputStyle}
                placeholder="9 12 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button
              disabled={loading || phone.length < 9}
              onClick={handleSendCode}
              style={goldButtonStyle}
            >
              {loading ? t(lang, 'common.loading') : t(lang, 'auth.sendCode')}
            </button>

            <div style={{ ...labelStyle, marginTop: spacing.xl }}>{t(lang, 'auth.iAmA')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {ROLES.map((r) => (
                <div
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: `1.4px solid ${role === r.value ? colors.gold : 'rgba(255,255,255,0.14)'}`,
                    background: role === r.value ? 'rgba(201,162,75,0.10)' : colors.charcoalSoft,
                    borderRadius: radius.lg,
                    padding: '13px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <b style={{ display: 'block', fontSize: 13.5, color: colors.cream }}>
                      {t(lang, r.titleKey)}
                    </b>
                    <span style={{ fontSize: 11, color: '#9AA0A2' }}>{t(lang, r.descKey)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 'code' && (
          <>
            <div style={labelStyle}>{t(lang, 'auth.enterCode')}</div>
            <input
              style={{ ...inputStyle, textAlign: 'center', letterSpacing: 4, marginBottom: spacing.lg }}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <button disabled={loading || code.length < 4} onClick={handleVerify} style={goldButtonStyle}>
              {loading ? t(lang, 'common.loading') : t(lang, 'auth.verifyCode')}
            </button>
          </>
        )}

        {error && (
          <p style={{ color: '#E38585', fontSize: 12.5, textAlign: 'center', marginTop: spacing.md }}>
            {error}
          </p>
        )}

        <p style={{ fontSize: 11, color: '#7C8284', textAlign: 'center', marginTop: spacing.lg, lineHeight: 1.5 }}>
          {t(lang, 'auth.disclaimer')}
        </p>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: '#A6ADB0',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const codeBoxStyle: React.CSSProperties = {
  width: 64,
  background: colors.charcoalSoft,
  border: '1.4px solid rgba(255,255,255,0.14)',
  borderRadius: radius.md,
  padding: '13px 8px',
  color: colors.cream,
  textAlign: 'center',
  fontWeight: 600,
  fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  background: colors.charcoalSoft,
  border: '1.4px solid rgba(255,255,255,0.14)',
  borderRadius: radius.md,
  padding: '13px 14px',
  color: colors.cream,
  fontSize: 14.5,
};

const goldButtonStyle: React.CSSProperties = {
  width: '100%',
  background: colors.gold,
  color: colors.charcoal,
  border: 'none',
  borderRadius: radius.md,
  padding: '14px 18px',
  fontWeight: 700,
  fontSize: 14,
};
