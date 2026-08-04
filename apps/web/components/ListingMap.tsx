'use client';

import { useEffect, useRef } from 'react';

interface BaseProps {
  latitude: number | null;
  longitude: number | null;
  label?: string;
  height?: number;
}

interface PickerProps extends BaseProps {
  /** When provided, the map becomes interactive: clicking/dragging moves the pin. */
  onPick: (lat: number, lng: number) => void;
}

/**
 * A small OpenStreetMap map via Leaflet. No API key, no account, no billing.
 * Two modes:
 *   - display only (no onPick): a static preview with a pin
 *   - picker (onPick given): click or drag to choose a location, used in
 *     Post a Listing so owners set their listing's exact spot
 *
 * Leaflet touches `window`, so it's imported dynamically to keep Next.js
 * server rendering happy.
 */
export function ListingMap(props: BaseProps | PickerProps) {
  const { latitude, longitude, label, height = 260 } = props;
  const onPick = 'onPick' in props ? props.onPick : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  // Keep the latest onPick in a ref so the map effect doesn't re-run (and
  // rebuild the whole map) every render just because the callback identity changed.
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Addis Ababa center, used as the picker's starting view when no pin is set yet.
  const ADDIS: [number, number] = [9.0108, 38.7613];

  useEffect(() => {
    if (!containerRef.current) return;
    // Display mode with no coordinates renders the fallback panel below instead.
    if (!onPick && (latitude == null || longitude == null)) return;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const hasPin = latitude != null && longitude != null;
      const center: [number, number] = hasPin ? [latitude!, longitude!] : ADDIS;

      const map = L.map(containerRef.current, {
        center,
        zoom: hasPin ? 15 : 12,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const icon = L.divIcon({
        className: 'koreb-pin',
        html:
          '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;' +
          'background:#C9A24B;transform:rotate(-45deg);border:2px solid #14181A;' +
          'box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      if (hasPin) {
        markerRef.current = L.marker([latitude!, longitude!], {
          icon,
          draggable: Boolean(onPickRef.current),
        }).addTo(map);
        if (label) markerRef.current.bindPopup(label);
      }

      // Picker mode: clicking places/moves the pin, dragging fine-tunes it.
      if (onPickRef.current) {
        const place = (lat: number, lng: number) => {
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
            markerRef.current.on('dragend', () => {
              const p = markerRef.current.getLatLng();
              onPickRef.current?.(p.lat, p.lng);
            });
          }
          onPickRef.current?.(lat, lng);
        };
        map.on('click', (e: any) => place(e.latlng.lat, e.latlng.lng));
        if (markerRef.current) {
          markerRef.current.on('dragend', () => {
            const p = markerRef.current.getLatLng();
            onPickRef.current?.(p.lat, p.lng);
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Intentionally NOT depending on onPick — see onPickRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, label, Boolean(onPick)]);

  if (!onPick && (latitude == null || longitude == null)) {
    return (
      <div
        style={{
          height,
          borderRadius: 14,
          background: '#ECEAE3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8A9093',
          fontSize: 13,
          border: '1px solid rgba(20,24,26,0.1)',
        }}
      >
        Location not provided for this listing
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid rgba(20,24,26,0.1)',
      }}
    />
  );
}
