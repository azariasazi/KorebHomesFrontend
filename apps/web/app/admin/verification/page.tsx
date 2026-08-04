'use client';

import { useState } from 'react';
import { useKoreb, useVerificationQueue, useModerateVerification } from '@koreb/hooks';
import { t } from '@koreb/i18n';
import { resolveMediaUrl } from '@koreb/utils';

export default function AdminVerificationPage() {
  const { lang, apiBaseUrl } = useKoreb();
  const { data: queue, isLoading } = useVerificationQueue();
  const { approve, reject } = useModerateVerification();

  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  async function confirmReject() {
    if (!rejecting) return;
    await reject.mutateAsync({ userId: rejecting, reason: reason.trim() || 'Document unclear' });
    setRejecting(null);
    setReason('');
  }

  return (
    <>
      <h1 className="admin-h1">{t(lang, 'admin.agentVerification')}</h1>
      <p className="admin-sub">{t(lang, 'admin.pendingVerification')}</p>

      <div className="admin-card">
        {isLoading ? (
          <div className="empty-panel"><p>—</p></div>
        ) : !queue || queue.length === 0 ? (
          <div className="empty-panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8A9093" strokeWidth="2">
              <path d="M12 2l2.4 2.1 3.1-.4 1 3 2.8 1.5-.8 3.1 1.5 2.8-2.4 2.1.4 3.1-3.1.4-1.5 2.8-2.8-1.5-3.1.4-.4-3.1-2.8-1.5 1.5-2.8-.8-3.1 2.8-1.5 1-3z" />
            </svg>
            <p>{t(lang, 'admin.noVerifications')}</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{lang === 'am' ? 'ስም' : 'Name'}</th>
                <th>{lang === 'am' ? 'ኤጀንሲ' : 'Agency'}</th>
                <th>{lang === 'am' ? 'ሰነድ' : 'Document'}</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((v) => (
                <tr key={v.userId}>
                  <td className="u-name">{v.name}</td>
                  <td>{v.agencyName ?? '—'}</td>
                  <td>
                    {v.documentUrl ? (
                      <a
                        className="doc-link"
                        href={resolveMediaUrl(v.documentUrl, apiBaseUrl) ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t(lang, 'admin.viewDocument')}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        className="btn btn-gold btn-sm"
                        onClick={() => approve.mutate(v.userId)}
                        disabled={approve.isPending}
                      >
                        {t(lang, 'admin.grantBadge')}
                      </button>
                      <button className="btn btn-reject btn-sm" onClick={() => setRejecting(v.userId)}>
                        {t(lang, 'admin.rejectVerification')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejecting && (
        <div className="modal-backdrop" onClick={() => !reject.isPending && setRejecting(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t(lang, 'admin.rejectVerification')}</h3>
            <div className="field-label">{t(lang, 'admin.suspendReason')}</div>
            <textarea
              className="field"
              style={{ minHeight: 72 }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn btn-outline-dark btn-full" onClick={() => setRejecting(null)}>
                {t(lang, 'admin.cancel')}
              </button>
              <button className="btn btn-reject btn-full" onClick={confirmReject} disabled={reject.isPending}>
                {reject.isPending ? t(lang, 'common.loading') : t(lang, 'admin.rejectVerification')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
