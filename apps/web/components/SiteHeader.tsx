'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLang, useMe, useLogout } from '@koreb/hooks';
import { t } from '@koreb/i18n';

type NavKey = 'buy' | 'rent' | 'post';

export function SiteHeader({ active }: { active?: NavKey }) {
  const { lang, toggleLang } = useLang();
  const { data: me } = useMe();
  const logout = useLogout();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account dropdown on any outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const nav: { key: NavKey; href: string; label: string }[] = [
    { key: 'buy', href: '/home?type=SALE', label: lang === 'am' ? 'ግዛ' : 'Buy' },
    { key: 'rent', href: '/home?type=RENT', label: lang === 'am' ? 'ተከራይ' : 'Rent' },
    {
      key: 'post',
      href: '/post-listing',
      label: lang === 'am' ? 'ንብረት አስተዋውቅ' : 'Post a Property',
    },
  ];

  // Display name for the trigger: real name, else agency name, else a generic
  // label — never the raw phone number (privacy, and it looks unfinished).
  const displayName = me?.name || me?.agencyName || (me ? t(lang, 'auth.myAccount') : '');
  const initial = (displayName || '?').trim().charAt(0).toUpperCase();

  async function handleLogout() {
    setMenuOpen(false);
    await logout.mutateAsync();
    // Land on the public feed as a signed-out visitor.
    router.push('/home');
  }

  return (
    <header className="site-header">
      <Link href="/home" className="logo-mark">
        {/* Uses the real brand mark from the guidelines, served out of /public. */}
        <img src="/favicon-192.png" alt="" />
        <span>{t(lang, 'common.appName')}</span>
      </Link>

      <nav className="site-nav">
        {nav.map((item) => (
          <Link key={item.key} href={item.href} className={active === item.key ? 'on' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="site-header-right">
        <button className="lang-pill" onClick={toggleLang} aria-label="Switch language">
          EN / አማ
        </button>

        {!me && (
          <>
            <Link href="/signup" className="btn btn-outline btn-sm">
              {lang === 'am' ? 'ግባ' : 'Log In'}
            </Link>
            <Link href="/signup?mode=signup" className="btn btn-outline btn-sm">
              {lang === 'am' ? 'ተመዝገብ' : 'Sign Up'}
            </Link>
          </>
        )}

        {me && (
          <div className="account-menu" ref={menuRef}>
            <button
              className="account-trigger"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span
                className="account-avatar"
                style={me.profilePhotoUrl ? { backgroundImage: `url(${me.profilePhotoUrl})` } : undefined}
              >
                {!me.profilePhotoUrl && initial}
              </span>
              <span className="account-name">{displayName}</span>
              <svg
                className={`account-caret${menuOpen ? ' open' : ''}`}
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {menuOpen && (
              <div className="account-dropdown" role="menu">
                <div className="account-dropdown-head">
                  <b>{displayName}</b>
                  <span>{t(lang, `roles.${me.role}`)}</span>
                </div>

                {(me.role === 'OWNER' || me.role === 'AGENT') && (
                  <Link href="/dashboard" className="account-item" onClick={() => setMenuOpen(false)}>
                    {t(lang, 'dashboard.title')}
                  </Link>
                )}
                {me.role === 'ADMIN' && (
                  <Link href="/admin" className="account-item" onClick={() => setMenuOpen(false)}>
                    {t(lang, 'admin.admin')}
                  </Link>
                )}
                <Link href="/favorites" className="account-item" onClick={() => setMenuOpen(false)}>
                  {t(lang, 'favorites.title')}
                </Link>

                <div className="account-divider" />

                <button className="account-item danger" onClick={handleLogout} disabled={logout.isPending}>
                  {logout.isPending ? t(lang, 'common.loading') : t(lang, 'auth.signOut')}
                </button>
              </div>
            )}
          </div>
        )}

        <Link href="/post-listing" className="btn btn-gold btn-sm">
          {lang === 'am' ? 'ንብረት አስተዋውቅ' : 'Post a Property'}
        </Link>
      </div>
    </header>
  );
}
