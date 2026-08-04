'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKoreb } from '@koreb/hooks';
import {
  formatPrice,
  listingTitle,
  listingThumb,
  locationLabel,
  metaChips,
} from '@koreb/utils';
import type { Listing } from '@koreb/types';

/**
 * The Home Feed map view — a split layout: a scrollable list of compact listing
 * cards on the left, an OpenStreetMap (Leaflet) with gold price-pins on the
 * right. The two panes are synced: clicking a card flies the map to its pin and
 * opens its popup; clicking a pin highlights and scrolls to its card. Listings
 * without coordinates can't be mapped, so they still appear in the list but are
 * noted as "no location" rather than dropped.
 */
export function ListingsMap({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const { lang, apiBaseUrl } = useKoreb();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const withCoords = listings.filter((l) => l.latitude != null && l.longitude != null);
  const missing = listings.length - withCoords.length;

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};

      const ADDIS: [number, number] = [9.0108, 38.7613];
      const map = L.map(containerRef.current, { center: ADDIS, zoom: 12, scrollWheelZoom: true });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const bounds: [number, number][] = [];

      for (const listing of withCoords) {
        const lat = listing.latitude as number;
        const lng = listing.longitude as number;
        bounds.push([lat, lng]);

        const priceShort = formatPrice(listing, lang);
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'koreb-price-pin',
            html:
              `<div style="background:#C9A24B;color:#14181A;font-weight:700;` +
              `font-size:12px;padding:4px 9px;border-radius:999px;white-space:nowrap;` +
              `border:1.5px solid #14181A;box-shadow:0 2px 6px rgba(0,0,0,.3)">${priceShort}</div>`,
            iconSize: [1, 1],
            iconAnchor: [0, 0],
          }),
        }).addTo(map);

        // Clicking a pin highlights its card in the list and scrolls it into view.
        marker.on('click', () => {
          setActiveId(listing.id);
          cardRefs.current[listing.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        markersRef.current[listing.id] = marker;
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withCoords.map((l) => l.id).join(','), apiBaseUrl, lang]);

  // Clicking a card flies the map to its pin and marks it active.
  function focusListing(listing: Listing) {
    setActiveId(listing.id);
    if (listing.latitude != null && listing.longitude != null && mapRef.current) {
      mapRef.current.flyTo([listing.latitude, listing.longitude], 15, { duration: 0.6 });
    }
  }

  return (
    <div className="map-split">
      <div className="map-list">
        {missing > 0 && (
          <p className="map-missing-note">
            {lang === 'am'
              ? `${missing} ማስታወቂያ አካባቢ ስለሌለው በካርታ ላይ አልታየም።`
              : `${missing} listing${missing === 1 ? '' : 's'} below have no location set.`}
          </p>
        )}
        {listings.map((listing) => {
          const thumb = listingThumb(listing, apiBaseUrl);
          return (
            <div
              key={listing.id}
              ref={(el) => {
                cardRefs.current[listing.id] = el;
              }}
              className={`map-card${activeId === listing.id ? ' active' : ''}`}
              onClick={() => focusListing(listing)}
              onDoubleClick={() => router.push(`/listing/${listing.id}`)}
            >
              <div
                className="map-card-photo"
                style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
              />
              <div className="map-card-info">
                <p className="map-card-price">{formatPrice(listing, lang)}</p>
                <p className="map-card-title">{listingTitle(listing, lang)}</p>
                <p className="map-card-loc">{locationLabel(listing)}</p>
                <div className="map-card-meta">
                  {metaChips(listing, lang).map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
                <a
                  className="map-card-link"
                  href={`/listing/${listing.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {lang === 'am' ? 'ዝርዝር ተመልከት →' : 'View details →'}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={containerRef} className="map-canvas-real" />
    </div>
  );
}
