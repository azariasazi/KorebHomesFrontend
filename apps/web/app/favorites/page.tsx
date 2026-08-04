'use client';

import { useRouter } from 'next/navigation';
import { SiteHeader } from '../../components/SiteHeader';
import { ListingCard, ListingCardSkeleton } from '../../components/ListingCard';
import { useKoreb, useMe, useFavorites, useFavoriteIds, useToggleFavorite } from '@koreb/hooks';
import { t } from '@koreb/i18n';

export default function FavoritesPage() {
  const router = useRouter();
  const { lang } = useKoreb();
  const { data: me, isLoading: meLoading } = useMe();
  const signedIn = !!me;

  const { data: favorites, isLoading } = useFavorites(signedIn);
  const { ids: favoriteIds } = useFavoriteIds(signedIn);
  const toggleFavorite = useToggleFavorite();

  // Not signed in → favorites are account-bound, so prompt sign-in.
  if (!meLoading && !signedIn) {
    return (
      <>
        <SiteHeader />
        <div className="state-panel" style={{ paddingTop: 90 }}>
          <h3>{t(lang, 'favorites.signInTitle')}</h3>
          <p style={{ maxWidth: 400, margin: '0 auto' }}>{t(lang, 'favorites.signInBody')}</p>
          <button className="btn btn-gold" onClick={() => router.push('/signup')}>
            {t(lang, 'favorites.signIn')}
          </button>
        </div>
      </>
    );
  }

  const entries = favorites ?? [];

  return (
    <>
      <SiteHeader />
      <div className="fav-wrap">
        <div className="fav-head">
          <h1>{t(lang, 'favorites.title')}</h1>
          <p>
            {entries.length > 0
              ? t(lang, 'favorites.count', { count: entries.length })
              : t(lang, 'favorites.subtitle')}
          </p>
        </div>

        {isLoading || meLoading ? (
          <div className="listing-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="state-panel">
            <h3>{t(lang, 'favorites.emptyTitle')}</h3>
            <p>{t(lang, 'favorites.emptyBody')}</p>
            <button className="btn btn-gold" onClick={() => router.push('/home')}>
              {t(lang, 'favorites.browse')}
            </button>
          </div>
        ) : (
          <div className="listing-grid">
            {entries.map((entry) => (
              <ListingCard
                key={entry.listing.id}
                listing={entry.listing}
                isFavorited={favoriteIds.has(entry.listing.id)}
                onToggleFavorite={(l) =>
                  toggleFavorite.mutate({ listingId: l.id, isFavorited: favoriteIds.has(l.id) })
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
