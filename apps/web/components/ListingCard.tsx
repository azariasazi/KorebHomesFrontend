'use client';

import Link from 'next/link';
import type { Listing } from '@koreb/types';
import { useKoreb } from '@koreb/hooks';
import {
  formatPrice,
  listingThumb,
  listingTitle,
  listingTypeLabel,
  soldRentedLabel,
  isSoldOrRented,
  locationLabel,
  metaChips,
} from '@koreb/utils';

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#8A9093" strokeWidth="2" width="11" height="11">
    <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export function ListingCard({
  listing,
  isFavorited,
  onToggleFavorite,
}: {
  listing: Listing;
  isFavorited?: boolean;
  onToggleFavorite?: (listing: Listing) => void;
}) {
  const { lang, apiBaseUrl } = useKoreb();
  const thumb = listingThumb(listing, apiBaseUrl);

  return (
    <Link href={`/listing/${listing.id}`} className="listing-card">
      <div
        className="listing-photo"
        style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
      >
        <span className="tag">{listingTypeLabel(listing, lang)}</span>
        {isSoldOrRented(listing) && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(20,24,26,0.55)',
              color: '#F6F3EC',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 2,
            }}
          >
            {soldRentedLabel(listing, lang)}
          </span>
        )}
        {onToggleFavorite && (
          <button
            className="fav"
            aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
            onClick={(e) => {
              // The card is a link, so stop the click from navigating away
              // when the user only meant to tap the heart.
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(listing);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill={isFavorited ? '#F6F3EC' : 'none'}
              stroke="#F6F3EC"
              strokeWidth="2"
            >
              <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.5-9.5 9-9.5 9z" />
            </svg>
          </button>
        )}
      </div>

      <div className="listing-info">
        <p className="listing-price">{formatPrice(listing, lang)}</p>
        <p className="listing-title">{listingTitle(listing, lang)}</p>
        <p className="listing-loc">
          <PinIcon />
          {locationLabel(listing)}
        </p>
        <div className="listing-meta">
          {metaChips(listing, lang).map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-block" style={{ height: 170 }} />
      <div style={{ padding: '14px 16px 17px' }}>
        <div className="skeleton-block" style={{ height: 20, width: '55%', borderRadius: 5, marginBottom: 10 }} />
        <div className="skeleton-block" style={{ height: 13, width: '75%', borderRadius: 5, marginBottom: 8 }} />
        <div className="skeleton-block" style={{ height: 11, width: '45%', borderRadius: 5 }} />
      </div>
    </div>
  );
}
