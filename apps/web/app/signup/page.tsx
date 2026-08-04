'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { t } from '@koreb/i18n';
import { useLang } from '@koreb/hooks';
import type { Role } from '@koreb/types';
import { api } from '../../lib/api';
import { ApiError } from '@koreb/api-client';

const ROLES: { value: Role; titleKey: string; descKey: string; icon: React.ReactNode }[] = [
  {
    value: 'BUYER_RENTER',
    titleKey: 'auth.roleBuyer',
    descKey: 'auth.roleBuyerDesc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#C9A24B" strokeWidth="2">
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v9h14v-9" />
      </svg>
    ),
  },
  {
    value: 'OWNER',
    titleKey: 'auth.roleOwner',
    descKey: 'auth.roleOwnerDesc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#C9A24B" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 21V13h6v8" />
      </svg>
    ),
  },
  {
    value: 'AGENT',
    titleKey: 'auth.roleAgent',
    descKey: 'auth.roleAgentDesc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#C9A24B" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Both the Log In and Sign Up header buttons land here (phone+OTP handles both
  // — it finds an existing account or creates one). We read ?mode= only to match
  // the wording to what the user clicked, so it doesn't feel like a mistake.
  const isSignup = searchParams.get('mode') === 'signup';
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
  // Name is only collected (and required) when creating an account.
  const nameReady = !isSignup || (firstName.trim().length > 0 && lastName.trim().length > 0);

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
      // Send the collected name on signup; on login it's blank and the backend
      // keeps the existing account's name.
      await api.auth.verifyOtp({
        phone: fullPhone,
        code,
        role,
        ...(fullName ? { name: fullName } : {}),
      });
      router.push('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="su-page">
      <div className="su-langbar">
        <Link href="/home" className="su-back-link">
          ← {t(lang, 'auth.backToBrowsing')}
        </Link>
        <button onClick={toggleLang} aria-label="Switch language">
          EN / አማ
        </button>
      </div>

      <div className="su-split">
        {/* left: brand story (text hides on mobile; mark + heading stay) */}
        <div className="su-left">
          <Link href="/home" className="su-brand-link" aria-label={t(lang, 'auth.backToBrowsing')}>
            <svg className="mark-big" viewBox="0 0 40 40">
              <polygon points="20,3 35,20 20,23 5,20" fill="#C9A24B" />
              <polygon points="20,23 35,20 20,37 5,20" fill="#3B6D30" />
              <polygon points="20,3 27.5,11.5 20,13 12.5,11.5" fill="#E4D3A8" />
            </svg>
          </Link>
          <h2>{t(lang, 'auth.brandHeadline')}</h2>
          <p>{t(lang, 'auth.brandStory')}</p>
        </div>

        {/* right: the form card */}
        <div className="su-right">
          <div className="su-card">
            <div className="step-lbl">
              {t(lang, isSignup ? 'auth.getStarted' : 'auth.welcomeBack')}
            </div>
            <h3>
              {step === 'code'
                ? t(lang, 'auth.enterCode')
                : t(lang, isSignup ? 'auth.createAccount' : 'auth.logInTitle')}
            </h3>

            {step === 'phone' && (
              <>
                {/* Google sign-in — styled and placed, but inactive until the
                    backend OAuth endpoint exists. Shown as "Soon" rather than a
                    dead button so it doesn't look broken. */}
                <button
                  className="su-social-btn"
                  disabled
                  title={t(lang, 'auth.googleSoonHint')}
                >
                  <svg className="g-icon" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.1 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" />
                  </svg>
                  {t(lang, 'auth.continueWithGoogle')}
                  <span className="su-social-soon">{t(lang, 'auth.comingSoon')}</span>
                </button>

                <div className="su-divider">{t(lang, 'auth.orDivider')}</div>

                {/* Name — collected only when creating an account. */}
                {isSignup && (
                  <div className="su-name-row">
                    <div style={{ flex: 1 }}>
                      <div className="su-field-label">{t(lang, 'auth.firstName')}</div>
                      <input
                        className="su-input"
                        placeholder={t(lang, 'auth.firstNamePlaceholder')}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        maxLength={40}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="su-field-label">{t(lang, 'auth.lastName')}</div>
                      <input
                        className="su-input"
                        placeholder={t(lang, 'auth.lastNamePlaceholder')}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        maxLength={40}
                      />
                    </div>
                  </div>
                )}

                <div className="su-field-label">{t(lang, 'auth.phoneNumber')}</div>
                <div className="su-phone-row">
                  <div className="su-code">+251</div>
                  <input
                    className="su-input"
                    placeholder="9 12 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button
                  className="su-gold-btn"
                  disabled={loading || phone.length < 9 || !nameReady}
                  onClick={handleSendCode}
                  style={{ marginBottom: 26 }}
                >
                  {loading ? t(lang, 'common.loading') : t(lang, 'auth.sendCode')}
                </button>

                {isSignup && (
                  <>
                    <div className="su-field-label">{t(lang, 'auth.iAmA')}</div>
                    <div className="su-role-grid">
                      {ROLES.map((r) => (
                        <div
                          key={r.value}
                          className={`su-role-card${role === r.value ? ' sel' : ''}`}
                          onClick={() => setRole(r.value)}
                        >
                          <div className="ic">{r.icon}</div>
                          <div>
                            <b>{t(lang, r.titleKey)}</b>
                            <span>{t(lang, r.descKey)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {step === 'code' && (
              <>
                <div className="su-field-label">{t(lang, 'auth.enterCode')}</div>
                <input
                  className="su-input"
                  style={{ textAlign: 'center', letterSpacing: 4, marginBottom: 20 }}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
                <button className="su-gold-btn" disabled={loading || code.length < 4} onClick={handleVerify}>
                  {loading ? t(lang, 'common.loading') : t(lang, 'auth.verifyCode')}
                </button>
                <button
                  onClick={() => setStep('phone')}
                  style={{ background: 'none', border: 'none', color: '#A6ADB0', fontSize: 12.5, marginTop: 14, width: '100%', cursor: 'pointer' }}
                >
                  ← {t(lang, 'common.back')}
                </button>
              </>
            )}

            {error && <p className="su-error">{error}</p>}

            {step === 'phone' && (
              <p className="su-switch-mode">
                {isSignup ? t(lang, 'auth.haveAccountPrompt') : t(lang, 'auth.noAccountPrompt')}{' '}
                <a href={isSignup ? '/signup' : '/signup?mode=signup'}>
                  {isSignup ? t(lang, 'auth.logInLink') : t(lang, 'auth.signUpLink')}
                </a>
              </p>
            )}

            <div className="su-disclaimer">{t(lang, 'auth.disclaimer')}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
