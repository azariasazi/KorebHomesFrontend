'use client';

import Link from 'next/link';
import { useKoreb, useAdminDashboard, useReviewQueue } from '@koreb/hooks';
import { t } from '@koreb/i18n';
import { formatPrice, listingTitle, listingThumb, locationLabel } from '@koreb/utils';

export default function AdminDashboardPage() {
  const { lang, apiBaseUrl } = useKoreb();
  const { data: stats, isLoading } = useAdminDashboard();
  const { data: queue } = useReviewQueue(1, 4);

  const today = new Date().toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const cards = [
    { key: 'totalListings', value: stats?.totalListings, gold: false },
    { key: 'totalUsers', value: stats?.totalUsers, gold: false },
    {
      key: 'revenueCollected',
      value: stats ? `${(stats.revenueCollectedEtb ?? 0).toLocaleString()} ETB` : undefined,
      gold: true,
    },
    { key: 'awaitingReview', value: stats?.awaitingReview, gold: true },
    { key: 'openReports', value: stats?.openReports, gold: false },
  ];

  return (
    <>
      <h1 className="admin-h1">{t(lang, 'admin.dashboard')}</h1>
      <p className="admin-sub">
        {t(lang, 'admin.dashboardSub')} — {today}
      </p>

      <div className="stat-cards">
        {cards.map((c) => (
          <div className="stat-card" key={c.key}>
            <div className="lbl">{t(lang, `admin.${c.key}`)}</div>
            <div className={`val${c.gold ? ' gold' : ''}`}>
              {isLoading ? '—' : (c.value ?? 0)}
            </div>
          </div>
        ))}
      </div>

      <div className="queue-card">
        <div className="queue-head">
          <h3>{t(lang, 'admin.listingReviewQueue')}</h3>
          <Link href="/admin/review" className="btn btn-outline-dark btn-sm">
            {t(lang, 'admin.viewAll')}
          </Link>
        </div>

        {!queue || queue.items.length === 0 ? (
          <div className="empty-panel">
            <p>{t(lang, 'admin.queueEmpty')}</p>
          </div>
        ) : (
          queue.items.map((listing) => {
            const thumb = listingThumb(listing, apiBaseUrl);
            return (
              <div className="queue-row" key={listing.id}>
                <div
                  className="qthumb"
                  style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
                />
                <div className="qinfo">
                  <b>
                    {listingTitle(listing, lang)} — {locationLabel(listing)}
                  </b>
                  <span>
                    {t(lang, 'admin.submittedBy', {
                      name: listing.owner.name,
                      role: listing.owner.role,
                      time: new Date(listing.createdAt).toLocaleDateString(),
                    })}{' '}
                    · {formatPrice(listing, lang)}
                  </span>
                </div>
                <div className="qactions">
                  <Link href="/admin/review" className="btn btn-gold btn-sm">
                    {t(lang, 'admin.preview')}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
