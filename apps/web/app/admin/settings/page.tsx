'use client';

import { useEffect, useState } from 'react';
import { useKoreb, useAdminSettings, useUpdateSetting } from '@koreb/hooks';
import { t } from '@koreb/i18n';

// Setting keys the backend understands (per the change requests). Reading the
// list generically means a new setting the backend adds still shows up, but
// these two get first-class controls.
const FEE_ENABLED_KEY = 'LISTING_FEE_ENABLED';
const FEE_AMOUNT_KEY = 'LISTING_FEE_ETB';

export default function AdminSettingsPage() {
  const { lang } = useKoreb();
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateSetting();

  const feeEnabled = settings?.find((s) => s.key === FEE_ENABLED_KEY)?.value === 'true';
  const feeAmountValue = settings?.find((s) => s.key === FEE_AMOUNT_KEY)?.value ?? '';

  const [amountDraft, setAmountDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setAmountDraft(feeAmountValue);
  }, [feeAmountValue]);

  function toggleFee() {
    update.mutate({ key: FEE_ENABLED_KEY, value: feeEnabled ? 'false' : 'true' });
  }

  async function saveAmount() {
    await update.mutateAsync({ key: FEE_AMOUNT_KEY, value: amountDraft.trim() || '0' });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  return (
    <>
      <h1 className="admin-h1">{t(lang, 'admin.settingsTitle')}</h1>
      <p className="admin-sub">{t(lang, 'admin.dashboardSub')}</p>

      <div className="admin-card" style={{ padding: '4px 22px' }}>
        {isLoading ? (
          <div className="empty-panel"><p>—</p></div>
        ) : (
          <>
            {/* fee on/off toggle */}
            <div className="setting-row">
              <div className="setting-info">
                <h4>{t(lang, 'admin.listingFeeEnabled')}</h4>
                <p>{t(lang, 'admin.listingFeeEnabledHint')}</p>
              </div>
              <button
                className={`toggle${feeEnabled ? ' on' : ''}`}
                onClick={toggleFee}
                disabled={update.isPending}
                aria-label="Toggle listing fees"
              >
                <span className="knob" />
              </button>
            </div>

            {/* fee amount */}
            <div className="setting-row">
              <div className="setting-info">
                <h4>{t(lang, 'admin.listingFeeAmount')}</h4>
                <p>{t(lang, 'admin.listingFeeAmountHint')}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
                <input
                  className="field"
                  type="number"
                  style={{ width: 120 }}
                  value={amountDraft}
                  onChange={(e) => setAmountDraft(e.target.value)}
                  disabled={!feeEnabled}
                />
                <button
                  className="btn btn-gold btn-sm"
                  onClick={saveAmount}
                  disabled={update.isPending || amountDraft === feeAmountValue}
                >
                  {savedFlash ? t(lang, 'admin.saved') : t(lang, 'admin.save')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#8a9093', marginTop: 16, lineHeight: 1.6, maxWidth: 560 }}>
        {lang === 'am'
          ? 'ክፍያዎች ሲጠፉ ማስታወቂያዎች በቀጥታ ወደ ግምገማ ይሄዳሉ። አስተዳዳሪ ግምገማ ሁልጊዜ ያስፈልጋል።'
          : 'While fees are off, listings skip payment and go straight to review. Admin review is always required, in both free and paid periods.'}
      </p>
    </>
  );
}
