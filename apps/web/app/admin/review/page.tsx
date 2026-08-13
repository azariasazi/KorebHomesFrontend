'use client';

import { useState } from 'react';
import { useKoreb, useReviewQueue, useModerateListing } from '@koreb/hooks';
import { t } from '@koreb/i18n';
import {
  formatPrice,
  listingTitle,
  listingThumb,
  locationLabel,
  floorLabel,
  rejectionLabel,
  resolveMediaUrl,
  amenityLabel,
  listingDescription,
  metaChips,
  listingTypeLabel,
  propertyTypeLabel,
} from '@koreb/utils';
import type { Listing, ListingRejectionCode } from '@koreb/types';

const REJECTION_CODES: ListingRejectionCode[] = [
  'DUPLICATE',
  'SUSPECTED_FRAUD',
  'POOR_PHOTOS',
  'INCOMPLETE_DETAILS',
  'PRICE_IMPLAUSIBLE',
  'PROHIBITED_CONTENT',
  'WRONG_CATEGORY',
  'OTHER',
];

export default function AdminReviewPage() {
  const { lang, apiBaseUrl } = useKoreb();
  const [page, setPage] = useState(1);
  const { data: queue, isLoading } = useReviewQueue(page, 20);
  const { approve, reject } = useModerateListing();

  const [rejecting, setRejecting] = useState<Listing | null>(null);
  const [previewing, setPreviewing] = useState<Listing | null>(null);
  const [code, setCode] = useState<ListingRejectionCode>('DUPLICATE');
  const [note, setNote] = useState('');

  async function confirmReject() {
    if (!rejecting) return;
    await reject.mutateAsync({ id: rejecting.id, code, note: note.trim() || undefined });
    setRejecting(null);
    setNote('');
    setCode('DUPLICATE');
  }

  return (
    <>
      <h1 className="admin-h1">{t(lang, 'admin.reviewQueue')}</h1>
      <p className="admin-sub">{t(lang, 'admin.dashboardSub')}</p>

      <div className="queue-card">
        {isLoading ? (
          <div className="empty-panel"><p>—</p></div>
        ) : !queue || queue.items.length === 0 ? (
          <div className="empty-panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8A9093" strokeWidth="2">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <p>{t(lang, 'admin.queueEmpty')}</p>
          </div>
        ) : (
          queue.items.map((listing) => {
            const thumb = listingThumb(listing, apiBaseUrl);
            const fl = floorLabel(listing, lang);
            return (
              <div className="queue-row" key={listing.id}>
                <div className="qthumb" style={thumb ? { backgroundImage: `url(${thumb})` } : undefined} />
                <div className="qinfo">
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        background: '#14181A', color: '#F6F3EC', fontSize: 10, fontWeight: 700,
                        padding: '4px 9px', borderRadius: 999, letterSpacing: 0.3,
                      }}
                    >
                      {listingTypeLabel(listing, lang)}
                    </span>
                    <span
                      style={{
                        background: '#EEF0F1', color: '#3A3F41', fontSize: 10, fontWeight: 700,
                        padding: '4px 9px', borderRadius: 999, letterSpacing: 0.3,
                      }}
                    >
                      {propertyTypeLabel(listing, lang)}
                    </span>
                  </div>
                  <b>
                    {listingTitle(listing, lang)} — {locationLabel(listing)}
                  </b>
                  <span>
                    {t(lang, 'admin.submittedBy', {
                      name: listing.owner.name,
                      role: listing.owner.role,
                      time: new Date(listing.createdAt).toLocaleString(),
                    })}
                    {' · '}
                    {formatPrice(listing, lang)}
                    {/* Admin can see the private unit number — buyers never can. */}
                    {listing.buildingName ? ` · ${listing.buildingName}` : ''}
                    {listing.unitNumber ? ` · ${t(lang, 'admin.privateUnitLabel')}: ${listing.unitNumber}` : ''}
                    {fl ? ` · ${fl}` : ''}
                  </span>
                </div>
                <div className="qactions">
                  <button
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => setPreviewing(listing)}
                  >
                    {t(lang, 'admin.preview')}
                  </button>
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => approve.mutate(listing.id)}
                    disabled={approve.isPending}
                  >
                    {t(lang, 'admin.approve')}
                  </button>
                  <button className="btn btn-reject btn-sm" onClick={() => setRejecting(listing)}>
                    {t(lang, 'admin.reject')}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {queue && queue.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '18px 0 6px' }}>
            <button className="btn btn-outline-dark btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ←
            </button>
            <span style={{ fontSize: 13, alignSelf: 'center', color: '#8a9093' }}>
              {page} / {queue.totalPages}
            </span>
            <button
              className="btn btn-outline-dark btn-sm"
              disabled={page >= queue.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* preview modal — uses the full listing already loaded in the queue,
          so it works even though the listing isn't LIVE yet (the public
          endpoint would refuse to return it). */}
      {previewing && (
        <div className="modal-backdrop" onClick={() => setPreviewing(null)}>
          <div className="modal-card" style={{ maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3>{listingTitle(previewing, lang)}</h3>
            <div style={{ display: 'flex', gap: 6, margin: '4px 0 10px' }}>
              <span
                style={{
                  background: '#14181A', color: '#F6F3EC', fontSize: 10, fontWeight: 700,
                  padding: '4px 9px', borderRadius: 999, letterSpacing: 0.3,
                }}
              >
                {listingTypeLabel(previewing, lang)}
              </span>
              <span
                style={{
                  background: '#EEF0F1', color: '#3A3F41', fontSize: 10, fontWeight: 700,
                  padding: '4px 9px', borderRadius: 999, letterSpacing: 0.3,
                }}
              >
                {propertyTypeLabel(previewing, lang)}
              </span>
            </div>

            {/* photos */}
            {previewing.photos && previewing.photos.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14 }}>
                {[...previewing.photos]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((p) => (
                    <img
                      key={p.id}
                      src={resolveMediaUrl(p.url, apiBaseUrl) ?? ''}
                      alt=""
                      style={{ height: 130, borderRadius: 8, flex: 'none' }}
                    />
                  ))}
              </div>
            ) : (
              <div style={{ padding: 20, background: '#eceae3', borderRadius: 8, textAlign: 'center', color: '#8a9093', marginBottom: 14 }}>
                {t(lang, 'listingDetail.noPhotos')}
              </div>
            )}

            <p className="ld-price" style={{ fontSize: 22 }}>{formatPrice(previewing, lang)}</p>
            <p style={{ color: '#5b6265', fontSize: 13, marginTop: 4 }}>
              {locationLabel(previewing)}
              {previewing.buildingName ? ` · ${previewing.buildingName}` : ''}
            </p>

            {/* admin-only private fields */}
            <div style={{ background: 'rgba(59,109,48,0.06)', border: '1px solid rgba(59,109,48,0.2)', borderRadius: 10, padding: '10px 13px', margin: '14px 0', fontSize: 12.5, color: '#3b6d30' }}>
              {previewing.unitNumber && (
                <div><b>{t(lang, 'admin.privateUnitLabel')}:</b> {previewing.unitNumber}</div>
              )}
              {floorLabel(previewing, lang) && <div>{floorLabel(previewing, lang)}</div>}
              <div style={{ opacity: 0.75, marginTop: 4 }}>
                {previewing.owner.name} ({previewing.owner.role})
                {previewing.owner.contactPhone ? ` · ${previewing.owner.contactPhone}` : ''}
              </div>
            </div>

            <div className="listing-meta" style={{ marginBottom: 12 }}>
              {metaChips(previewing, lang).map((m) => (
                <span key={m} style={{ marginRight: 12 }}>{m}</span>
              ))}
            </div>

            {previewing.amenities?.length > 0 && (
              <p style={{ fontSize: 13, color: '#3a3f41', marginBottom: 10 }}>
                {previewing.amenities.map((a) => amenityLabel(a, lang)).join(' · ')}
              </p>
            )}

            {listingDescription(previewing, lang) && (
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#3a3f41', whiteSpace: 'pre-wrap' }}>
                {listingDescription(previewing, lang)}
              </p>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-gold btn-full"
                onClick={() => {
                  approve.mutate(previewing.id);
                  setPreviewing(null);
                }}
              >
                {t(lang, 'admin.approve')}
              </button>
              <button
                className="btn btn-reject btn-full"
                onClick={() => {
                  setRejecting(previewing);
                  setPreviewing(null);
                }}
              >
                {t(lang, 'admin.reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* reject modal */}
      {rejecting && (
        <div className="modal-backdrop" onClick={() => !reject.isPending && setRejecting(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t(lang, 'admin.rejectListingTitle')}</h3>

            <div className="field-label">{t(lang, 'admin.rejectReasonLabel')}</div>
            <select className="field" value={code} onChange={(e) => setCode(e.target.value as ListingRejectionCode)}>
              {REJECTION_CODES.map((c) => (
                <option key={c} value={c}>
                  {rejectionLabel(c, lang)}
                </option>
              ))}
            </select>

            <div className="field-label" style={{ marginTop: 14 }}>
              {t(lang, 'admin.rejectNoteLabel')}
            </div>
            <textarea
              className="field"
              style={{ minHeight: 72 }}
              placeholder={t(lang, 'admin.rejectNotePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="modal-actions">
              <button className="btn btn-outline-dark btn-full" onClick={() => setRejecting(null)}>
                {t(lang, 'admin.cancel')}
              </button>
              <button className="btn btn-reject btn-full" onClick={confirmReject} disabled={reject.isPending}>
                {reject.isPending ? t(lang, 'common.loading') : t(lang, 'admin.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
