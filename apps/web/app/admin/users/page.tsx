'use client';

import { useState } from 'react';
import { useKoreb, useAdminUsers, useModerateUser } from '@koreb/hooks';
import { t } from '@koreb/i18n';
import type { CurrentUser, Role } from '@koreb/types';

type RoleFilter = Role | 'ALL';

const FILTERS: { value: RoleFilter; labelKey: string }[] = [
  { value: 'ALL', labelKey: 'admin.allUsers' },
  { value: 'OWNER', labelKey: 'admin.owners' },
  { value: 'AGENT', labelKey: 'admin.agents' },
  { value: 'BUYER_RENTER', labelKey: 'admin.buyers' },
  { value: 'ADMIN', labelKey: 'admin.admins' },
];

// The backend may include a suspension flag on users; the API-REFERENCE shows
// suspend/unsuspend endpoints, so we read an optional `isSuspended` if present.
type AdminUser = CurrentUser & { isSuspended?: boolean };

export default function AdminUsersPage() {
  const { lang } = useKoreb();
  const [filter, setFilter] = useState<RoleFilter>('ALL');
  const { data: users, isLoading } = useAdminUsers(filter === 'ALL' ? undefined : filter);
  const { suspend, unsuspend } = useModerateUser();

  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');

  function rolePillClass(role: Role) {
    if (role === 'AGENT') return 'role-pill agent';
    if (role === 'ADMIN') return 'role-pill admin';
    return 'role-pill';
  }

  async function confirmSuspend() {
    if (!suspending) return;
    await suspend.mutateAsync({ id: suspending.id, reason: reason.trim() || 'Violation of terms' });
    setSuspending(null);
    setReason('');
  }

  return (
    <>
      <h1 className="admin-h1">{t(lang, 'admin.users')}</h1>
      <p className="admin-sub">{t(lang, 'admin.dashboardSub')}</p>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`filter-tab${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {t(lang, f.labelKey)}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {isLoading ? (
          <div className="empty-panel"><p>—</p></div>
        ) : !users || users.length === 0 ? (
          <div className="empty-panel"><p>{t(lang, 'admin.noUsers')}</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{lang === 'am' ? 'ስም' : 'Name'}</th>
                <th>{lang === 'am' ? 'ስልክ' : 'Phone'}</th>
                <th>{lang === 'am' ? 'ሚና' : 'Role'}</th>
                <th>{t(lang, 'admin.joined')}</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {(users as AdminUser[]).map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="u-name">{u.name ?? '—'}</div>
                    {u.isSuspended && <span className="status-pill suspended">{t(lang, 'admin.suspended')}</span>}
                  </td>
                  <td>{u.phone}</td>
                  <td><span className={rolePillClass(u.role)}>{u.role}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u.role !== 'ADMIN' &&
                      (u.isSuspended ? (
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => unsuspend.mutate(u.id)}
                          disabled={unsuspend.isPending}
                        >
                          {t(lang, 'admin.unsuspend')}
                        </button>
                      ) : (
                        <button className="btn btn-reject btn-sm" onClick={() => setSuspending(u)}>
                          {t(lang, 'admin.suspend')}
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {suspending && (
        <div className="modal-backdrop" onClick={() => !suspend.isPending && setSuspending(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t(lang, 'admin.suspend')} — {suspending.name}</h3>
            <div className="field-label">{t(lang, 'admin.suspendReason')}</div>
            <textarea
              className="field"
              style={{ minHeight: 72 }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn btn-outline-dark btn-full" onClick={() => setSuspending(null)}>
                {t(lang, 'admin.cancel')}
              </button>
              <button className="btn btn-reject btn-full" onClick={confirmSuspend} disabled={suspend.isPending}>
                {suspend.isPending ? t(lang, 'common.loading') : t(lang, 'admin.suspend')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
