'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SiteHeader } from '../../../components/SiteHeader';
import { ListingMap } from '../../../components/ListingMap';
import {
  useKoreb,
  useListing,
  useMyListing,
  usePublicUser,
  useFavoriteIds,
  useToggleFavorite,
  useReportListing,
} from '@koreb/hooks';
import { t } from '@koreb/i18n';
import {
  formatPrice,
  resolveMediaUrl,
  listingTitle,
  listingTypeLabel,
  locationLabel,
  floorLabel,
  amenityLabel,
  listingDescription,
  contactLinks,
  soldRentedLabel,
  isSoldOrRented,
} from '@koreb/utils';

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, apiBaseUrl } = useKoreb();

  // "?preview=mine" fetches via the owner endpoint, which returns the listing at
  // ANY status — needed because the public endpoint only returns LIVE listings,
  // so previewing something under review / rejected would otherwise 404.
  const isPreview = searchParams.get('preview') === 'mine';
  const publicQuery = useListing(isPreview ? undefined : params.id);
  const previewQuery = useMyListing(params.id, isPreview);
  const { data: listing, isLoading, isError } = isPreview ? previewQuery : publicQuery;
  const { data: ownerCard } = usePublicUser(listing?.owner?.id);
  const { ids: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const report = useReportListing();

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Fake or fraudulent');
  const [reportDetails, setReportDetails] = useState('');
  const [reportDone, setReportDone] = useState(false);

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="ld-wrap">
          <div className="skeleton-block" style={{ height: 380, borderRadius: 16, marginBottom: 26 }} />
          <div className="skeleton-block" style={{ height: 30, width: '40%', borderRadius: 6, marginBottom: 12 }} />
          <div className="skeleton-block" style={{ height: 18, width: '60%', borderRadius: 6 }} />
        </div>
      </>
    );
  }

  if (isError || !listing) {
    return (
      <>
        <SiteHeader />
        <div className="state-panel" style={{ paddingTop: 90 }}>
          <h3>{t(lang, 'listingDetail.notFoundTitle')}</h3>
          <p>{t(lang, 'listingDetail.notFoundBody')}</p>
          <button className="btn btn-outline-dark" onClick={() => router.push('/home')}>
            {t(lang, 'listingDetail.backToBrowse')}
          </button>
        </div>
      </>
    );
  }

  const photos = [...(listing.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const isFav = favoriteIds.has(listing.id);

  // Contact number isn't exposed by the backend yet (see change request), so
  // these links are null for now and the buttons fall back to a note.
  const links = contactLinks(listing.owner.contactPhone ?? ownerCard?.contactPhone);

  const facts: { label: string; value: string }[] = [];
  if (listing.bedrooms) facts.push({ label: t(lang, 'listingDetail.bedrooms'), value: String(listing.bedrooms) });
  if (listing.bathrooms) facts.push({ label: t(lang, 'listingDetail.bathrooms'), value: String(listing.bathrooms) });
  if (listing.sizeSqm) facts.push({ label: t(lang, 'listingDetail.size'), value: `${listing.sizeSqm} m²` });
  const fl = floorLabel(listing, lang);
  if (fl) facts.push({ label: t(lang, 'listingDetail.floor'), value: fl });
  if (listing.buildingName) facts.push({ label: t(lang, 'listingDetail.building'), value: listing.buildingName });
  if (listing.furnished != null)
    facts.push({
      label: t(lang, 'listingDetail.furnished'),
      value: listing.furnished ? t(lang, 'listingDetail.yes') : t(lang, 'listingDetail.no'),
    });

  const description = listingDescription(listing, lang);
  const listingId = listing.id;

  async function submitReport() {
    try {
      await report.mutateAsync({ listingId, reason: reportReason, details: reportDetails || undefined });
      setReportDone(true);
    } catch {
      // If unauthenticated the endpoint 401s — surface a sign-in nudge.
      alert(t(lang, 'listingDetail.signInToReport'));
    }
  }

  const isAgent = (ownerCard?.role ?? listing.owner.role) === 'AGENT';
  const contactTitle = isAgent
    ? t(lang, 'listingDetail.contactAgent')
    : t(lang, 'listingDetail.contactOwner');

  return (
    <>
      <SiteHeader />
      <div className="ld-wrap">
        <button className="ld-back" onClick={() => router.back()}>
          ← {t(lang, 'common.back')}
        </button>

        {/* ---------- gallery ---------- */}
        {photos.length === 0 ? (
          <div className="ld-gallery-empty">{t(lang, 'listingDetail.noPhotos')}</div>
        ) : (
          <div className="ld-gallery">
            {photos.slice(0, 5).map((p, i) => {
              const url = resolveMediaUrl(p.url, apiBaseUrl);
              const isLastVisible = i === 4 && photos.length > 5;
              return (
                <div
                  key={p.id}
                  className={`g-cell${i === 0 ? ' g-main' : ''}`}
                  style={url ? { backgroundImage: `url(${url})` } : undefined}
                  onClick={() => setGalleryOpen(true)}
                >
                  {isLastVisible && <div className="g-more">+{photos.length - 5} {t(lang, 'listingDetail.photos')}</div>}
                </div>
              );
            })}
          </div>
        )}

        <div className="ld-columns">
          {/* ---------- left column ---------- */}
          <div>
            <div className="ld-tag-row">
              <span className="ld-tag">{listingTypeLabel(listing, lang)}</span>
              {isSoldOrRented(listing) && (
                <span className="ld-tag" style={{ background: 'rgba(20,24,26,0.85)', letterSpacing: 1 }}>
                  {soldRentedLabel(listing, lang)}
                </span>
              )}
              <span className="ld-views">{t(lang, 'listingDetail.viewCount', { count: listing.viewCount })}</span>
            </div>
            <p className="ld-price">{formatPrice(listing, lang)}</p>
            <h1 className="ld-title">{listingTitle(listing, lang)}</h1>
            <div className="ld-loc">
              <svg viewBox="0 0 24 24" fill="none" stroke="#5B6265" strokeWidth="2" width="14" height="14">
                <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {[listing.buildingName, locationLabel(listing)].filter(Boolean).join(' · ')}
            </div>

            {/* facts */}
            <div className="ld-section">
              <h3>{t(lang, 'listingDetail.propertyDetails')}</h3>
              <div className="ld-facts">
                {facts.map((f) => (
                  <div className="fact" key={f.label}>
                    <div className="fact-lbl">{f.label}</div>
                    <div className="fact-val">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* amenities */}
            {listing.amenities?.length > 0 && (
              <div className="ld-section">
                <h3>{t(lang, 'listingDetail.amenities')}</h3>
                <div className="amenity-grid">
                  {listing.amenities.map((a) => (
                    <div className="amenity" key={a}>
                      <span className="dot" />
                      {amenityLabel(a, lang)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* description */}
            {description && (
              <div className="ld-section">
                <h3>{t(lang, 'listingDetail.description')}</h3>
                <p className="ld-desc">{description}</p>
              </div>
            )}

            {/* location / map */}
            <div className="ld-section">
              <h3>{t(lang, 'listingDetail.location')}</h3>
              <ListingMap
                latitude={listing.latitude}
                longitude={listing.longitude}
                label={locationLabel(listing)}
              />
            </div>
          </div>

          {/* ---------- sticky contact card ---------- */}
          <aside className="ld-side">
            <div className="side-card">
              <div className="agent-row">
                <div
                  className="agent-avatar"
                  style={
                    listing.owner.profilePhotoUrl
                      ? { backgroundImage: `url(${resolveMediaUrl(listing.owner.profilePhotoUrl, apiBaseUrl)})` }
                      : undefined
                  }
                />
                <div>
                  <div className="agent-name">
                    {listing.owner.name}
                    {ownerCard?.isVerifiedAgent && (
                      <span className="badge-verified">
                        <svg viewBox="0 0 24 24" fill="#A8823A">
                          <path d="M12 2l2.4 2.1 3.1-.4 1 3 2.8 1.5-.8 3.1 1.5 2.8-2.4 2.1.4 3.1-3.1.4-1.5 2.8-2.8-1.5-3.1.4-.4-3.1-2.8-1.5 1.5-2.8-.8-3.1 2.8-1.5 1-3z" />
                          <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                        </svg>
                        {t(lang, 'common.verifiedAgent')}
                      </span>
                    )}
                  </div>
                  <div className="agent-sub">
                    {[listing.owner.agencyName].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>

              <div className="contact-col">
                {links ? (
                  <>
                    <a className="btn btn-gold btn-full" href={links.call}>
                      {t(lang, 'common.call')}
                    </a>
                    <a className="btn btn-outline-dark btn-full" href={links.whatsapp} target="_blank" rel="noreferrer">
                      {t(lang, 'common.whatsapp')}
                    </a>
                    {/* Telegram — opens a chat by phone number. Only resolves if
                        the recipient allows "find me by phone" in Telegram's
                        privacy settings; otherwise Telegram shows "user not
                        found" (expected, not an error on our end). */}
                    <a
                      className="btn btn-outline-dark btn-full"
                      href={`https://t.me/+${(listing.owner.contactPhone ?? ownerCard?.contactPhone ?? '').replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t(lang, 'common.telegram')}
                    </a>
                  </>
                ) : (
                  <>
                    <button className="btn btn-gold btn-full" disabled>
                      {t(lang, 'common.call')}
                    </button>
                    <p className="contact-note">{t(lang, 'listingDetail.contactUnavailable')}</p>
                  </>
                )}
                <button
                  className="btn btn-charcoal btn-full"
                  onClick={() =>
                    toggleFavorite.mutate({ listingId: listing.id, isFavorited: isFav })
                  }
                >
                  {isFav ? `♥ ${t(lang, 'common.saved')}` : `♡ ${t(lang, 'common.save')}`}
                </button>
              </div>
            </div>

            <button className="report-link" onClick={() => setReportOpen(true)}>
              ⚑ {t(lang, 'listingDetail.reportListing')}
            </button>
          </aside>
        </div>
      </div>

      {/* ---------- report modal ---------- */}
      {reportOpen && (
        <div className="modal-backdrop" onClick={() => !report.isPending && setReportOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {reportDone ? (
              <>
                <h3>{t(lang, 'listingDetail.reportThanks')}</h3>
                <div className="modal-actions">
                  <button
                    className="btn btn-charcoal btn-full"
                    onClick={() => {
                      setReportOpen(false);
                      setReportDone(false);
                    }}
                  >
                    OK
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>{t(lang, 'listingDetail.reportTitle')}</h3>
                {[
                  t(lang, 'listingDetail.reportReasonFake'),
                  t(lang, 'listingDetail.reportReasonSold'),
                  t(lang, 'listingDetail.reportReasonWrong'),
                  t(lang, 'listingDetail.reportReasonOffensive'),
                  t(lang, 'listingDetail.reportReasonOther'),
                ].map((reason) => (
                  <label key={reason} className="radio-row">
                    <input
                      type="radio"
                      name="report"
                      checked={reportReason === reason}
                      onChange={() => setReportReason(reason)}
                    />
                    {reason}
                  </label>
                ))}
                <textarea
                  className="report-textarea"
                  placeholder={t(lang, 'listingDetail.reportDetails')}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />
                <div className="modal-actions">
                  <button className="btn btn-outline-dark btn-full" onClick={() => setReportOpen(false)}>
                    {t(lang, 'common.cancel')}
                  </button>
                  <button className="btn btn-gold btn-full" onClick={submitReport} disabled={report.isPending}>
                    {report.isPending ? t(lang, 'common.loading') : t(lang, 'listingDetail.reportSubmit')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
