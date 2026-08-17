'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { t } from '@koreb/i18n';
import { useLang } from '@koreb/hooks';
import { api } from '../../lib/api';
import { ApiError } from '@koreb/api-client';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}

function ForgotPasswordInner() {
  const router = useRouter();
  const { lang, toggleLang } = useLang();

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
      // Always advances — the backend returns the same message whether or not
      // the account exists (no enumeration), so we just move to the code step.
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
    <main className="su-page">
      <div className="su-langbar">
        <Link href="/signup" className="su-back-link">
          ← {t(lang, 'auth.backToLogin')}
        </Link>
        <button onClick={toggleLang} aria-label="Switch language">
          EN / አማ
        </button>
      </div>

      <div className="su-split">
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

        <div className="su-right">
          <div className="su-card">
            <div className="step-lbl">{t(lang, 'auth.forgotEyebrow')}</div>
            <h3>{t(lang, 'auth.forgotTitle')}</h3>

            {step === 'request' && (
              <>
                <p className="su-sent-note">{t(lang, 'auth.forgotSubtitle')}</p>
                <div className="su-field-label">{t(lang, 'auth.identifier')}</div>
                <input
                  className="su-input"
                  placeholder={t(lang, 'auth.identifierPlaceholder')}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ marginBottom: 18 }}
                />
                <button
                  className="su-gold-btn"
                  disabled={loading || identifier.trim().length < 3}
                  onClick={handleRequest}
                >
                  {loading ? t(lang, 'common.loading') : t(lang, 'auth.sendResetCode')}
                </button>
              </>
            )}

            {step === 'reset' && (
              <>
                <p className="su-sent-note">{t(lang, 'auth.resetSubtitle')}</p>
                <div className="su-field-label">{t(lang, 'auth.enterCode')}</div>
                <input
                  className="su-input"
                  style={{ textAlign: 'center', letterSpacing: 4, marginBottom: 16 }}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
                <div className="su-field-label">{t(lang, 'auth.newPassword')}</div>
                <input
                  className="su-input"
                  type="password"
                  placeholder={t(lang, 'auth.passwordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ marginBottom: 18 }}
                />
                <button
                  className="su-gold-btn"
                  disabled={loading || code.length < 4 || newPassword.length < 8}
                  onClick={handleReset}
                >
                  {loading ? t(lang, 'common.loading') : t(lang, 'auth.resetPasswordBtn')}
                </button>
                <button
                  onClick={() => setStep('request')}
                  style={{ background: 'none', border: 'none', color: '#A6ADB0', fontSize: 12.5, marginTop: 14, width: '100%', cursor: 'pointer' }}
                >
                  ← {t(lang, 'common.back')}
                </button>
              </>
            )}

            {step === 'done' && (
              <>
                <p className="su-sent-note">{t(lang, 'auth.resetDone')}</p>
                <button className="su-gold-btn" onClick={() => router.push('/signup')}>
                  {t(lang, 'auth.logIn')}
                </button>
              </>
            )}

            {error && <p className="su-error">{error}</p>}

            <div className="su-disclaimer">{t(lang, 'auth.disclaimer')}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
