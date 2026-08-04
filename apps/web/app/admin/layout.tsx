'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useKoreb, useMe, useAdminDashboard } from '@koreb/hooks';
import { t } from '@koreb/i18n';

const NAV = [
  { key: 'dashboard', href: '/admin', labelKey: 'admin.dashboard', icon: DashIcon },
  { key: 'review', href: '/admin/review', labelKey: 'admin.reviewQueue', icon: CheckIcon, badge: 'awaitingReview' },
  { key: 'users', href: '/admin/users', labelKey: 'admin.users', icon: UsersIcon },
  { key: 'verification', href: '/admin/verification', labelKey: 'admin.agentVerification', icon: BadgeIcon },
  { key: 'reports', href: '/admin/reports', labelKey: 'admin.reports', icon: FlagIcon, badge: 'openReports' },
  { key: 'settings', href: '/admin/settings', labelKey: 'admin.pricingSettings', icon: GearIcon },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useKoreb();
  const pathname = usePathname();
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const { data: stats } = useAdminDashboard();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#14181A' }}>
        <div className="skeleton-block" style={{ width: 40, height: 40, borderRadius: 20 }} />
      </div>
    );
  }

  // Admin area is gated on the ADMIN role. A non-admin (or signed-out) user
  // never sees the panel — the backend also enforces this, so this is the
  // friendly front door, not the security boundary.
  if (!me || me.role !== 'ADMIN') {
    return (
      <div className="state-panel" style={{ paddingTop: 120 }}>
        <h3>{t(lang, 'admin.accessDeniedTitle')}</h3>
        <p>{t(lang, 'admin.accessDeniedBody')}</p>
        <button className="btn btn-gold" onClick={() => router.push('/home')}>
          {t(lang, 'listingDetail.backToBrowse')}
        </button>
      </div>
    );
  }

  const badgeValue = (key?: string): number | undefined => {
    if (!stats || !key) return undefined;
    const v = (stats as Record<string, number>)[key];
    return v && v > 0 ? v : undefined;
  };

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <Link href="/admin" className="logo-mark">
          <img src="/favicon-192.png" alt="" />
          <span>{t(lang, 'common.appName')}</span>
        </Link>

        <nav className="admin-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            const badge = badgeValue('badge' in item ? item.badge : undefined);
            return (
              <Link key={item.key} href={item.href} className={`admin-nav-item${active ? ' active' : ''}`}>
                <Icon />
                {t(lang, item.labelKey)}
                {badge != null && <span className="badge">{badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="admin-signout">
          <button className="admin-nav-item" onClick={() => router.push('/home')}>
            <ExitIcon />
            {lang === 'am' ? 'ውጣ' : 'Exit admin'}
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}

function DashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}
function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 2.1 3.1-.4 1 3 2.8 1.5-.8 3.1 1.5 2.8-2.4 2.1.4 3.1-3.1.4-1.5 2.8-2.8-1.5-3.1.4-.4-3.1-2.8-1.5 1.5-2.8-.8-3.1 2.8-1.5 1-3z" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 21V4h13l-2 4 2 4H4" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1h.1a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  );
}
function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
