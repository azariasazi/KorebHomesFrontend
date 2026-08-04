'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '../../components/SiteHeader';
import {
  useKoreb,
  useMe,
  useMyListings,
  useManageMyListing,
  useInitiatePayment,
} from '@koreb/hooks';
import { t } from '@koreb/i18n';
import {
  formatPrice,
  listingTitle,
  listingThumb,
  locationLabel,
  rejectionLabel,
} from '@koreb/utils';
import type { Listing, ListingStatus } from '@koreb/types';

type StatusFilter = 'ALL' | ListingStatus;

export default function DashboardPage() {
  const router = useRouter();
  const { lang, apiBaseUrl } = useKoreb();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: listings, isLoading } = useMyListings(!!me && me.role !== 'BUYER_RENTER');
  const { remove, renew, resubmit, markSoldRented, markAvailable } = useManageMyListing();
  const initiatePayment = useInitiatePayment();

  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [deleting, setDeleting] = useState<Listing | null>(null);

  const all = useMemo(() => listings ?? [], [listings]);

  // --- stat card numbers, computed from the owner's own listings ---
  const stats = useMemo(() => {
    const active = all.filter((l) => l.status === 'LIVE').length;
    const awaiting = all.filter((l) => l.status === 'AWAITING_REVIEW').length;
    const views = all.reduce((sum, l) => sum + (l.viewCount ?? 0), 0);
    return { active, awaiting, views };
  }, [all]);

  const counts = useMemo(
    () => ({
      all: all.length,
      live: all.filter((l) => l.status === 'LIVE').length,
      awaiting: all.filter((l) => l.status === 'AWAITING_REVIEW').length,
      rejected: all.filter((l) => l.status === 'REJECTED').length,
      soldRented: all.filter((l) => l.status === 'SOLD' || l.status === 'RENTED').length,
    }),
    [all]
  );

  const filtered = useMemo(() => {
    if (filter === 'ALL') return all;
    if (filter === 'SOLD') return all.filter((l) => l.status === 'SOLD' || l.status === 'RENTED');
    return all.filter((l) => l.status === filter);
  }, [all, filter]);

  if (meLoading) {
    return (
      <>
        <SiteHeader />
        <div className="dash-wrap">
          <div className="skeleton-block" style={{ height: 40, width: '50%', borderRadius: 8, marginBottom: 20 }} />
          <div className="skeleton-block" style={{ height: 90, borderRadius: 12, marginBottom: 16 }} />
          <div className="skeleton-block" style={{ height: 200, borderRadius: 12 }} />
        </div>
      </>
    );
  }

  if (!me || me.role === 'BUYER_RENTER') {
    return (
      <>
        <SiteHeader />
        <div className="state-panel" style={{ paddingTop: 90 }}>
          <h3>{t(lang, 'dashboard.notOwnerTitle')}</h3>
          <p style={{ maxWidth: 420, margin: '0 auto' }}>{t(lang, 'dashboard.notOwnerBody')}</p>
        </div>
      </>
    );
  }

  const isAgent = me.role === 'AGENT';

  async function completePayment(id: string) {
    try {
      const pay = await initiatePayment.mutateAsync(id);
      window.location.href = pay.checkoutUrl;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Payment could not be started.');
    }
  }

  const filterTabs: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: t(lang, 'dashboard.allCount', { count: counts.all }) },
    { value: 'LIVE', label: t(lang, 'dashboard.liveCount', { count: counts.live }) },
    { value: 'AWAITING_REVIEW', label: t(lang, 'dashboard.awaitingCount', { count: counts.awaiting }) },
    { value: 'REJECTED', label: t(lang, 'dashboard.rejectedCount', { count: counts.rejected }) },
    { value: 'SOLD', label: t(lang, 'dashboard.soldRentedCount', { count: counts.soldRented }) },
  ];

  function statusBadge(status: ListingStatus) {
    const map: Record<string, { cls: string; key: string }> = {
      LIVE: { cls: 'live', key: 'dashboard.statusLIVE' },
      AWAITING_REVIEW: { cls: 'awaiting', key: 'dashboard.statusAWAITING_REVIEW' },
      AWAITING_PAYMENT: { cls: 'awaiting', key: 'dashboard.statusAWAITING_PAYMENT' },
      REJECTED: { cls: 'rejected', key: 'dashboard.statusREJECTED' },
      UNPUBLISHED: { cls: 'unpublished', key: 'dashboard.statusUNPUBLISHED' },
      SOLD: { cls: 'soldrented', key: 'dashboard.statusSOLD' },
      RENTED: { cls: 'soldrented', key: 'dashboard.statusRENTED' },
    };
    const m = map[status] ?? { cls: 'unpublished', key: 'dashboard.statusUNPUBLISHED' };
    return <span className={`status-badge ${m.cls}`}>{t(lang, m.key)}</span>;
  }

  // Subline under each listing title: location + posted date + views, or a
  // rejection reason for rejected ones (so the "why" is always right there).
  function subline(l: Listing): string {
    if (l.status === 'REJECTED') {
      const reason = l.rejectionCode ? rejectionLabel(l.rejectionCode, lang) : '';
      return `${lang === 'am' ? 'ምክንያት' : 'Reason'}: ${reason}${l.rejectionReason ? ` — ${l.rejectionReason}` : ''}`;
    }
    if (l.status === 'AWAITING_REVIEW' || l.status === 'AWAITING_PAYMENT') {
      return t(lang, 'dashboard.submittedAgo', { date: new Date(l.createdAt).toLocaleDateString() });
    }
    return t(lang, 'dashboard.postedAgo', {
      area: locationLabel(l),
      date: new Date(l.createdAt).toLocaleDateString(),
      views: l.viewCount ?? 0,
    });
  }

  return (
    <>
      <SiteHeader />
      <div className="dash-wrap">
        {/* agent-only identity row + billing card */}
        {isAgent && (
          <>
            <div className="agent-id-row">
              <div
                className="av"
                style={
                  me.profilePhotoUrl ? { backgroundImage: `url(${me.profilePhotoUrl})` } : undefined
                }
              />
              <div>
                <b>
                  {me.agencyName || me.name || 'Agency'}
                  {me.verificationStatus === 'APPROVED' && (
                    <span className="badge-verified">
                      <svg viewBox="0 0 24 24" fill="#A8823A">
                        <path d="M12 2l2.4 2.1 3.1-.4 1 3 2.8 1.5-.8 3.1 1.5 2.8-2.4 2.1.4 3.1-3.1.4-1.5 2.8-2.8-1.5-3.1.4-.4-3.1-2.8-1.5 1.5-2.8-.8-3.1 2.8-1.5 1-3z" />
                        <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                      </svg>
                      {t(lang, 'dashboard.verified')}
                    </span>
                  )}
                </b>
                <span>
                  {t(lang, 'dashboard.agentAccount')}
                  {me.name ? ` · ${me.name}` : ''}
                </span>
              </div>
            </div>

            <div className="billing-card">
              <div className="bt">{t(lang, 'dashboard.billingTitle')}</div>
              <p className="bm">{t(lang, 'dashboard.billingBody')}</p>
            </div>
          </>
        )}

        {/* header row with the persistent gold Post action */}
        <div className="dash-header-row">
          <div>
            <h2>{t(lang, 'dashboard.title')}</h2>
            <p>
              {isAgent
                ? t(lang, 'dashboard.listingsAcrossAgency', { count: counts.all })
                : `${me.name ?? ''}${me.name ? ' · ' : ''}${t(lang, 'dashboard.ownerAccount')}`}
            </p>
          </div>
          <button className="btn btn-gold" onClick={() => router.push('/post-listing')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14181A" strokeWidth="2.4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t(lang, 'dashboard.postNewListing')}
          </button>
        </div>

        {/* stat cards */}
        <div className="stat-cards">
          <div className="stat-card">
            <div className="lbl">{t(lang, 'dashboard.statActive')}</div>
            <div className="val">{stats.active}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">{t(lang, 'dashboard.statAwaiting')}</div>
            <div className="val gold">{stats.awaiting}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">{t(lang, 'dashboard.statViews')}</div>
            <div className="val">{stats.views.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="lbl">{t(lang, 'dashboard.statInquiries')}</div>
            <div className="val" style={{ color: '#9AA0A2' }} title={t(lang, 'dashboard.inquiriesSoon')}>
              —
            </div>
          </div>
        </div>

        {/* filter chips */}
        <div className="dash-toolbar">
          <div className="chips">
            {filterTabs.map((f) => (
              <div
                key={f.value}
                className={`chip${filter === f.value ? ' active' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* table */}
        {isLoading ? (
          <div className="skeleton-block" style={{ height: 200, borderRadius: 14 }} />
        ) : filtered.length === 0 ? (
          <div className="state-panel">
            <h3>{t(lang, all.length > 0 ? 'dashboard.emptyFilterTitle' : 'dashboard.emptyTitle')}</h3>
            <p>{t(lang, all.length > 0 ? 'dashboard.emptyFilterBody' : 'dashboard.emptyBody')}</p>
            {all.length === 0 && (
              <button className="btn btn-gold" onClick={() => router.push('/post-listing')}>
                {t(lang, 'dashboard.newListing')}
              </button>
            )}
          </div>
        ) : (
          <div className="dash-table">
            {filtered.map((l) => {
              const thumb = listingThumb(l, apiBaseUrl);
              return (
                <div className="dash-row" key={l.id}>
                  <div className="dash-thumb" style={thumb ? { backgroundImage: `url(${thumb})` } : undefined} />
                  <div className="dash-col-title">
                    <b>{listingTitle(l, lang)}</b>
                    <span>{subline(l)}</span>
                  </div>
                  <div className="dash-col-price">{formatPrice(l, lang)}</div>
                  <div className="dash-col-status">{statusBadge(l.status)}</div>
                  <div className="dash-col-actions">
                    {/* view — works for any status via preview mode */}
                    {(l.status === 'LIVE' || l.status === 'AWAITING_REVIEW' || l.status === 'REJECTED') && (
                      <a
                        href={`/listing/${l.id}?preview=mine`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-dark btn-sm"
                      >
                        {t(lang, 'dashboard.viewLive')}
                      </a>
                    )}
                    {l.status === 'REJECTED' && (
                      <button className="btn btn-gold btn-sm" onClick={() => resubmit.mutate(l.id)} disabled={resubmit.isPending}>
                        {t(lang, 'dashboard.resubmit')}
                      </button>
                    )}
                    {l.status === 'UNPUBLISHED' && (
                      <button className="btn btn-gold btn-sm" onClick={() => renew.mutate(l.id)} disabled={renew.isPending}>
                        {t(lang, 'dashboard.renew')}
                      </button>
                    )}
                    {l.status === 'AWAITING_PAYMENT' && (
                      <button className="btn btn-gold btn-sm" onClick={() => completePayment(l.id)} disabled={initiatePayment.isPending}>
                        {t(lang, 'dashboard.completePayment')}
                      </button>
                    )}
                    {l.status === 'LIVE' && (
                      <button className="btn btn-outline-dark btn-sm" onClick={() => markSoldRented.mutate(l.id)} disabled={markSoldRented.isPending}>
                        {l.listingType === 'RENT' ? t(lang, 'dashboard.markRented') : t(lang, 'dashboard.markSold')}
                      </button>
                    )}
                    {(l.status === 'SOLD' || l.status === 'RENTED') && (
                      <button className="btn btn-gold btn-sm" onClick={() => markAvailable.mutate(l.id)} disabled={markAvailable.isPending}>
                        {t(lang, 'dashboard.markAvailable')}
                      </button>
                    )}
                    {/* edit — hidden for terminal sold/rented, matching the mockup's editable rows */}
                    {l.status !== 'SOLD' && l.status !== 'RENTED' && (
                      <button className="btn btn-outline-dark btn-sm" onClick={() => router.push(`/post-listing?edit=${l.id}`)}>
                        {t(lang, 'dashboard.edit')}
                      </button>
                    )}
                    {/* remove / withdraw depending on whether it's public yet */}
                    <button className="btn btn-sm btn-danger-soft" onClick={() => setDeleting(l)}>
                      {l.status === 'AWAITING_REVIEW' || l.status === 'AWAITING_PAYMENT'
                        ? t(lang, 'dashboard.withdraw')
                        : t(lang, 'dashboard.remove')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* delete confirm */}
      {deleting && (
        <div className="modal-backdrop" onClick={() => !remove.isPending && setDeleting(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t(lang, 'dashboard.deleteConfirmTitle')}</h3>
            <p style={{ fontSize: 13.5, color: '#5b6265', lineHeight: 1.6 }}>
              {t(lang, 'dashboard.deleteConfirmBody')}
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline-dark btn-full" onClick={() => setDeleting(null)}>
                {t(lang, 'dashboard.cancel')}
              </button>
              <button
                className="btn btn-reject btn-full"
                onClick={async () => {
                  await remove.mutateAsync(deleting.id);
                  setDeleting(null);
                }}
                disabled={remove.isPending}
              >
                {remove.isPending ? t(lang, 'common.loading') : t(lang, 'dashboard.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
