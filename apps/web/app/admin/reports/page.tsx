'use client';

import { useState } from 'react';
import { useKoreb, useAdminReports, useResolveReport } from '@koreb/hooks';
import { t } from '@koreb/i18n';

type StatusFilter = 'OPEN' | 'REVIEWED' | 'DISMISSED';

export default function AdminReportsPage() {
  const { lang } = useKoreb();
  const [filter, setFilter] = useState<StatusFilter>('OPEN');
  const { data: reports, isLoading } = useAdminReports(filter);
  const resolve = useResolveReport();

  const filters: StatusFilter[] = ['OPEN', 'REVIEWED', 'DISMISSED'];

  return (
    <>
      <h1 className="admin-h1">{t(lang, 'admin.reports')}</h1>
      <p className="admin-sub">{t(lang, 'admin.reportsTitle')}</p>

      <div className="filter-tabs">
        {filters.map((f) => (
          <button
            key={f}
            className={`filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'OPEN' ? (lang === 'am' ? 'ክፍት' : 'Open')
              : f === 'REVIEWED' ? (lang === 'am' ? 'የተገመገመ' : 'Reviewed')
              : (lang === 'am' ? 'የተሰረዘ' : 'Dismissed')}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {isLoading ? (
          <div className="empty-panel"><p>—</p></div>
        ) : !reports || reports.length === 0 ? (
          <div className="empty-panel"><p>{t(lang, 'admin.noReports')}</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(lang, 'admin.reportReason')}</th>
                <th>{lang === 'am' ? 'ዝርዝር' : 'Details'}</th>
                <th>{lang === 'am' ? 'ቀን' : 'Date'}</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="u-name">{r.reason}</td>
                  <td style={{ maxWidth: 260, color: '#5b6265' }}>{r.details ?? '—'}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <a
                        href={`/listing/${r.listingId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-dark btn-sm"
                      >
                        {t(lang, 'admin.viewListing')}
                      </a>
                      {r.status === 'OPEN' && (
                        <>
                          <button
                            className="btn btn-gold btn-sm"
                            onClick={() => resolve.mutate({ id: r.id, status: 'REVIEWED' })}
                            disabled={resolve.isPending}
                          >
                            {t(lang, 'admin.markReviewed')}
                          </button>
                          <button
                            className="btn btn-outline-dark btn-sm"
                            onClick={() => resolve.mutate({ id: r.id, status: 'DISMISSED' })}
                            disabled={resolve.isPending}
                          >
                            {t(lang, 'admin.dismiss')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
