'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteHeader } from '../../components/SiteHeader';
import { ListingMap } from '../../components/ListingMap';
import {
  useKoreb,
  useMe,
  useMyListing,
  useCreateListing,
  useUpdateListing,
  useInitiatePayment,
} from '@koreb/hooks';
import { t } from '@koreb/i18n';
import { amenityLabel, AMENITY_OPTIONS, ADDIS_SUBCITIES, floorOptions, resolveMediaUrl } from '@koreb/utils';
import type { PropertyType, ListingType, CreateListingInput } from '@koreb/types';

type Step = 0 | 1 | 2 | 3 | 4;
const TOTAL = 5;

interface FormState {
  propertyType: PropertyType;
  listingType: ListingType;
  priceEtb: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  buildingName: string;
  unitNumber: string;
  floorNumber: string;
  furnished: boolean;
  amenities: string[];
  region: string;
  city: string;
  subCity: string;
  areaName: string;
  latitude: number | null;
  longitude: number | null;
  descriptionEn: string;
  descriptionAm: string;
}

const initialForm: FormState = {
  propertyType: 'APARTMENT',
  listingType: 'RENT',
  priceEtb: '',
  bedrooms: '',
  bathrooms: '',
  sizeSqm: '',
  buildingName: '',
  unitNumber: '',
  floorNumber: '',
  furnished: false,
  amenities: [],
  region: 'Addis Ababa',
  city: 'Addis Ababa',
  subCity: 'Bole',
  areaName: '',
  latitude: null,
  longitude: null,
  descriptionEn: '',
  descriptionAm: '',
};

const PROPERTY_TYPES: { value: PropertyType; labelKey: string }[] = [
  { value: 'HOUSE', labelKey: 'postListing.house' },
  { value: 'APARTMENT', labelKey: 'postListing.apartment' },
  { value: 'LAND', labelKey: 'postListing.land' },
  { value: 'COMMERCIAL', labelKey: 'postListing.commercial' },
];

export default function PostListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, apiBaseUrl } = useKoreb();
  const { data: me, isLoading: meLoading, isError: meError } = useMe();

  // Edit mode: /post-listing?edit=<id> loads an existing listing to modify.
  const editId = searchParams.get('edit') ?? undefined;
  const isEdit = Boolean(editId);
  const { data: editListing, isLoading: editLoading } = useMyListing(editId, isEdit);

  const [verifyAcknowledged, setVerifyAcknowledged] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  // In edit mode, photos already on the listing — shown alongside new ones,
  // and any the user removes get deleted on save.
  const [existingPhotos, setExistingPhotos] = useState<{ id: string; url: string }[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [prefilled, setPrefilled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<'review' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const initiatePayment = useInitiatePayment();

  // When the listing to edit arrives, fill the form from it once.
  useEffect(() => {
    if (!editListing || prefilled) return;
    setForm({
      propertyType: editListing.propertyType,
      listingType: editListing.listingType,
      priceEtb: String(Number(editListing.priceEtb) || ''),
      bedrooms: editListing.bedrooms != null ? String(editListing.bedrooms) : '',
      bathrooms: editListing.bathrooms != null ? String(editListing.bathrooms) : '',
      sizeSqm: editListing.sizeSqm != null ? String(editListing.sizeSqm) : '',
      buildingName: editListing.buildingName ?? '',
      unitNumber: editListing.unitNumber ?? '',
      floorNumber: editListing.floorNumber != null ? String(editListing.floorNumber) : '',
      furnished: Boolean(editListing.furnished),
      amenities: editListing.amenities ?? [],
      region: editListing.region ?? 'Addis Ababa',
      city: editListing.city ?? 'Addis Ababa',
      subCity: editListing.subCity ?? 'Bole',
      areaName: editListing.areaName ?? '',
      latitude: editListing.latitude,
      longitude: editListing.longitude,
      descriptionEn: editListing.descriptionEn ?? '',
      descriptionAm: editListing.descriptionAm ?? '',
    });
    setExistingPhotos(
      [...(editListing.photos ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((p) => ({ id: p.id, url: resolveMediaUrl(p.url, apiBaseUrl) ?? '' }))
    );
    setPrefilled(true);
  }, [editListing, prefilled, apiBaseUrl]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isApartment = form.propertyType === 'APARTMENT';
  const showRoomFields = form.propertyType === 'HOUSE' || form.propertyType === 'APARTMENT';

  // ---- gating: must be signed in, must be owner/agent ----
  if (meLoading || (isEdit && editLoading && !prefilled)) {
    return (
      <>
        <SiteHeader />
        <div className="pl-wrap">
          <div className="skeleton-block" style={{ height: 40, borderRadius: 8, marginBottom: 20 }} />
          <div className="skeleton-block" style={{ height: 200, borderRadius: 12 }} />
        </div>
      </>
    );
  }

  if (meError || !me) {
    return (
      <>
        <SiteHeader />
        <div className="state-panel" style={{ paddingTop: 80 }}>
          <h3>{t(lang, 'postListing.signInToPost')}</h3>
          <button className="btn btn-gold" onClick={() => router.push('/signup')}>
            {lang === 'am' ? 'ግባ' : 'Sign in'}
          </button>
        </div>
      </>
    );
  }

  if (me.role === 'BUYER_RENTER') {
    return (
      <>
        <SiteHeader />
        <div className="state-panel" style={{ paddingTop: 80 }}>
          <h3>{t(lang, 'postListing.mustBeOwnerTitle')}</h3>
          <p style={{ maxWidth: 420, margin: '0 auto' }}>{t(lang, 'postListing.mustBeOwnerBody')}</p>
        </div>
      </>
    );
  }

  // ---- Fayda verification gate (placeholder until backend module ships) ----
  // Shown before the form the first time. We let them proceed for now since the
  // Fayda module isn't live yet — but the gate is here so it's a one-line switch
  // to make it blocking once verification is real. Skipped when editing an
  // existing listing (they already cleared this when first posting).
  const needsVerification = me.verificationStatus !== 'APPROVED';
  if (!isEdit && needsVerification && !verifyAcknowledged) {
    return (
      <>
        <SiteHeader />
        <div className="pl-wrap">
          <div className="verify-panel">
            <div className="vp-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#A8823A" strokeWidth="2">
                <path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h3>{t(lang, 'postListing.verifyRequiredTitle')}</h3>
            <p>{t(lang, 'postListing.verifyRequiredBody')}</p>
            <p className="verify-soon">{t(lang, 'postListing.verifyComingSoon')}</p>
            <button className="btn btn-gold" onClick={() => setVerifyAcknowledged(true)}>
              {t(lang, 'postListing.verifyContinueAnyway')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---- success screen ----
  if (result === 'review') {
    return (
      <>
        <SiteHeader />
        <div className="pl-wrap">
          <div className="pl-success">
            <div className="ok-icon">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="2.4">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <h2>{t(lang, isEdit ? 'postListing.updatedTitle' : 'postListing.submittedTitle')}</h2>
            <p>{t(lang, isEdit ? 'postListing.updatedBody' : 'postListing.submittedBody')}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-gold" onClick={() => router.push('/dashboard')}>
                {t(lang, 'postListing.goToDashboard')}
              </button>
              <button
                className="btn btn-outline-dark"
                onClick={() => {
                  setForm(initialForm);
                  setPhotos([]);
                  setStep(0);
                  setResult(null);
                }}
              >
                {t(lang, 'postListing.postAnother')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ---- per-step validation ----
  function validateStep(s: Step): string | null {
    if (s === 0) return null; // type always has a default
    if (s === 1) {
      if (!form.priceEtb || Number(form.priceEtb) <= 0) return t(lang, 'postListing.missingRequired');
      if (isApartment && !form.unitNumber.trim()) return t(lang, 'postListing.unitRequiredApt');
    }
    if (s === 2) {
      if (!form.city.trim()) return t(lang, 'postListing.missingRequired');
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(TOTAL - 1, s + 1) as Step);
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1) as Step);
  }

  function onPickPhotos(files: FileList | null) {
    if (!files) return;
    const room = 10 - photos.length - existingPhotos.length;
    const chosen = Array.from(files).slice(0, room);
    setPhotos((prev) => [
      ...prev,
      ...chosen.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  async function submit() {
    setError(null);
    const fields: CreateListingInput = {
      propertyType: form.propertyType,
      listingType: form.listingType,
      priceEtb: Number(form.priceEtb),
      region: form.region.trim() || 'Addis Ababa',
      city: form.city.trim(),
      subCity: form.subCity || undefined,
      areaName: form.areaName.trim() || undefined,
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined,
      bedrooms: showRoomFields && form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: showRoomFields && form.bathrooms ? Number(form.bathrooms) : undefined,
      sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : undefined,
      buildingName: form.buildingName.trim() || undefined,
      unitNumber: isApartment ? form.unitNumber.trim() : form.unitNumber.trim() || undefined,
      floorNumber: form.floorNumber !== '' ? Number(form.floorNumber) : undefined,
      furnished: showRoomFields ? form.furnished : undefined,
      amenities: form.amenities.length ? form.amenities : undefined,
      descriptionEn: form.descriptionEn.trim() || undefined,
      descriptionAm: form.descriptionAm.trim() || undefined,
    };

    try {
      const built = photos.map((p) => {
        const fd = new FormData();
        fd.append('file', p.file);
        return { formData: fd };
      });

      // --- EDIT MODE: update fields, remove deleted photos, add new ones ---
      if (isEdit && editId) {
        await updateListing.mutateAsync({
          id: editId,
          fields,
          removedPhotoIds,
          newPhotos: built,
          onProgress: (done, total) => setUploadProgress({ done, total }),
        });
        setUploadProgress(null);
        // PATCH re-queues to review automatically (per the API contract), so
        // the same "submitted for review" confirmation applies.
        setResult('review');
        return;
      }

      // --- CREATE MODE ---
      const submitted = await createListing.mutateAsync({
        fields,
        photos: built,
        onProgress: (done, total) => setUploadProgress({ done, total }),
      });
      setUploadProgress(null);

      // Branch on the backend's requiresPayment flag — free period → review,
      // paid period → Chapa checkout.
      if (submitted.requiresPayment) {
        const pay = await initiatePayment.mutateAsync(submitted.id);
        window.location.href = pay.checkoutUrl;
      } else {
        setResult('review');
      }
    } catch (e) {
      setUploadProgress(null);
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  }

  const stepLabels = [
    t(lang, 'postListing.stepType'),
    t(lang, 'postListing.stepDetails'),
    t(lang, 'postListing.stepLocation'),
    t(lang, 'postListing.stepPhotos'),
    t(lang, 'postListing.stepReview'),
  ];

  return (
    <>
      <SiteHeader active="post" />
      <div className="pl-wrap">
        {isEdit && (
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, margin: '0 0 18px' }}>
            {t(lang, 'postListing.editTitle')}
          </h1>
        )}
        {/* stepper */}
        <div className="pl-stepper">
          {Array.from({ length: TOTAL }).flatMap((_, i) => {
            const nodes = [];
            if (i > 0) {
              nodes.push(<div key={`l${i}`} className={`step-line${i <= step ? ' done' : ''}`} />);
            }
            nodes.push(
              <div
                key={`d${i}`}
                className={`step-dot${i < step ? ' done' : ''}${i === step ? ' now' : ''}`}
              >
                {i < step ? '✓' : i + 1}
              </div>
            );
            return nodes;
          })}
        </div>

        <div className="pl-label">
          {t(lang, 'postListing.stepOfLabel', { step: step + 1, total: TOTAL, label: stepLabels[step] })}
        </div>

        {/* ---------------- Step 0: Type ---------------- */}
        {step === 0 && (
          <>
            <h2 className="pl-h2">{t(lang, 'postListing.whatAreYouListing')}</h2>
            <div className="field-label">{t(lang, 'postListing.propertyType')}</div>
            <div className="type-grid">
              {PROPERTY_TYPES.map((pt) => (
                <div
                  key={pt.value}
                  className={`type-card${form.propertyType === pt.value ? ' sel' : ''}`}
                  onClick={() => set('propertyType', pt.value)}
                >
                  <PropertyIcon type={pt.value} selected={form.propertyType === pt.value} />
                  <span>{t(lang, pt.labelKey)}</span>
                </div>
              ))}
            </div>

            <div className="field-label">{t(lang, 'postListing.listingType')}</div>
            <div className="seg">
              <div className={form.listingType === 'SALE' ? 'sel' : ''} onClick={() => set('listingType', 'SALE')}>
                {t(lang, 'postListing.forSale')}
              </div>
              <div className={form.listingType === 'RENT' ? 'sel' : ''} onClick={() => set('listingType', 'RENT')}>
                {t(lang, 'postListing.forRent')}
              </div>
            </div>
          </>
        )}

        {/* ---------------- Step 1: Details ---------------- */}
        {step === 1 && (
          <>
            <h2 className="pl-h2">{t(lang, 'postListing.tellUsAbout')}</h2>

            <div className="field-label">
              {form.listingType === 'RENT' ? t(lang, 'postListing.priceRent') : t(lang, 'postListing.price')} *
            </div>
            <input
              className="field"
              type="number"
              inputMode="numeric"
              value={form.priceEtb}
              onChange={(e) => set('priceEtb', e.target.value)}
              placeholder="0"
            />

            {showRoomFields && (
              <div className="two-col">
                <div>
                  <div className="field-label">{t(lang, 'postListing.bedrooms')}</div>
                  <input className="field" type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
                </div>
                <div>
                  <div className="field-label">{t(lang, 'postListing.bathrooms')}</div>
                  <input className="field" type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
                </div>
              </div>
            )}

            <div className="field-label">{t(lang, 'postListing.size')}</div>
            <input className="field" type="number" value={form.sizeSqm} onChange={(e) => set('sizeSqm', e.target.value)} />

            {(isApartment || form.propertyType === 'COMMERCIAL') && (
              <>
                <div className="field-label">
                  {t(lang, 'postListing.buildingName')}
                  {isApartment ? '' : ''}
                </div>
                <input
                  className="field"
                  value={form.buildingName}
                  onChange={(e) => set('buildingName', e.target.value)}
                  placeholder="Zefmesh Grand"
                  maxLength={120}
                />
                <div className="field-hint">{t(lang, 'postListing.buildingNameHint')}</div>

                <div className="two-col">
                  <div>
                    <div className="field-label">
                      {t(lang, 'postListing.unitNumber')} {isApartment ? '*' : ''}
                    </div>
                    <input
                      className="field"
                      value={form.unitNumber}
                      onChange={(e) => set('unitNumber', e.target.value)}
                      placeholder="4B"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <div className="field-label">{t(lang, 'postListing.floorNumber')}</div>
                    <select
                      className="field"
                      value={form.floorNumber}
                      onChange={(e) => set('floorNumber', e.target.value)}
                    >
                      <option value="">{lang === 'am' ? 'ይምረጡ' : 'Select…'}</option>
                      {floorOptions(lang).map((o) => (
                        <option key={o.value} value={String(o.value)}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* the required privacy note next to unit number */}
                <div className="private-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#3B6D30" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                  </svg>
                  <p>{t(lang, 'postListing.unitPrivateNote')}</p>
                </div>
              </>
            )}

            {showRoomFields && (
              <>
                <div className="field-label">{t(lang, 'postListing.furnished')}</div>
                <div className="seg">
                  <div className={!form.furnished ? 'sel' : ''} onClick={() => set('furnished', false)}>
                    {t(lang, 'listingDetail.no')}
                  </div>
                  <div className={form.furnished ? 'sel' : ''} onClick={() => set('furnished', true)}>
                    {t(lang, 'listingDetail.yes')}
                  </div>
                </div>
              </>
            )}

            <div className="field-label">{t(lang, 'postListing.amenities')}</div>
            <div className="amenities">
              {AMENITY_OPTIONS.map((a) => (
                <div
                  key={a}
                  className={`amenity-chip${form.amenities.includes(a) ? ' sel' : ''}`}
                  onClick={() =>
                    set(
                      'amenities',
                      form.amenities.includes(a)
                        ? form.amenities.filter((x) => x !== a)
                        : [...form.amenities, a]
                    )
                  }
                >
                  {amenityLabel(a, lang)}
                </div>
              ))}
            </div>

            <div className="field-label">{t(lang, 'postListing.descriptionEnglish')}</div>
            <textarea className="field" value={form.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)} />
            <div className="field-label">{t(lang, 'postListing.descriptionAmharic')}</div>
            <textarea className="field" value={form.descriptionAm} onChange={(e) => set('descriptionAm', e.target.value)} />
            <div className="field-hint">{t(lang, 'postListing.descriptionHint')}</div>
          </>
        )}

        {/* ---------------- Step 2: Location ---------------- */}
        {step === 2 && (
          <>
            <h2 className="pl-h2">{t(lang, 'postListing.whereIsIt')}</h2>
            <div className="two-col">
              <div>
                <div className="field-label">{t(lang, 'postListing.city')} *</div>
                <input className="field" value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <div className="field-label">{t(lang, 'postListing.subCity')}</div>
                <select className="field" value={form.subCity} onChange={(e) => set('subCity', e.target.value)}>
                  {ADDIS_SUBCITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-label">{t(lang, 'postListing.areaName')}</div>
            <input
              className="field"
              value={form.areaName}
              onChange={(e) => set('areaName', e.target.value)}
              placeholder={t(lang, 'postListing.areaHint')}
            />

            <div className="field-label">{t(lang, 'postListing.pinLocation')}</div>
            <div className="field-hint">{t(lang, 'postListing.pinHint')}</div>
            <ListingMap
              latitude={form.latitude}
              longitude={form.longitude}
              height={280}
              onPick={(lat, lng) => {
                set('latitude', lat);
                set('longitude', lng);
              }}
            />
          </>
        )}

        {/* ---------------- Step 3: Photos ---------------- */}
        {step === 3 && (
          <>
            <h2 className="pl-h2">{t(lang, 'postListing.addPhotos')}</h2>
            <div className="field-label">{t(lang, 'postListing.photosLabel')}</div>
            <div className="photo-grid">
              {/* existing photos (edit mode) — removing one queues it for deletion on save */}
              {existingPhotos.map((p, i) => (
                <div key={p.id} className="photo-slot filled" style={{ backgroundImage: `url(${p.url})` }}>
                  <button
                    className="rm"
                    onClick={() => {
                      setRemovedPhotoIds((prev) => [...prev, p.id]);
                      setExistingPhotos((prev) => prev.filter((x) => x.id !== p.id));
                    }}
                  >
                    ×
                  </button>
                  {i === 0 && photos.length === 0 && (
                    <span className="cover-badge">{t(lang, 'postListing.coverPhoto')}</span>
                  )}
                </div>
              ))}
              {photos.map((p, i) => (
                <div key={i} className="photo-slot filled" style={{ backgroundImage: `url(${p.preview})` }}>
                  <button
                    className="rm"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    ×
                  </button>
                  {existingPhotos.length === 0 && i === 0 && (
                    <span className="cover-badge">{t(lang, 'postListing.coverPhoto')}</span>
                  )}
                </div>
              ))}
              {existingPhotos.length + photos.length < 10 && (
                <div className="photo-slot" onClick={() => fileInputRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#14181A" strokeWidth="2" width="24" height="24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onPickPhotos(e.target.files)}
            />
            <p className="photo-hint">{t(lang, 'postListing.photoHint')}</p>
          </>
        )}

        {/* ---------------- Step 4: Review ---------------- */}
        {step === 4 && (
          <>
            <h2 className="pl-h2">{t(lang, 'postListing.reviewAndSubmit')}</h2>
            <div className="review-summary">
              <ReviewRow k={t(lang, 'postListing.propertyType')} v={t(lang, `postListing.${form.propertyType.toLowerCase()}`)} />
              <ReviewRow k={t(lang, 'postListing.listingType')} v={form.listingType === 'RENT' ? t(lang, 'postListing.forRent') : t(lang, 'postListing.forSale')} />
              <ReviewRow k={t(lang, 'postListing.price')} v={`${Number(form.priceEtb || 0).toLocaleString()} ETB`} />
              {form.buildingName && <ReviewRow k={t(lang, 'postListing.buildingName')} v={form.buildingName} />}
              {isApartment && form.unitNumber && (
                <ReviewRow k={t(lang, 'postListing.unitNumber')} v={`${form.unitNumber} 🔒`} />
              )}
              <ReviewRow k={t(lang, 'postListing.city')} v={[form.subCity, form.city].filter(Boolean).join(', ')} />
              <ReviewRow k={t(lang, 'postListing.stepPhotos')} v={String(photos.length)} />
              <ReviewRow
                k={t(lang, 'postListing.pinLocation')}
                v={form.latitude != null ? '✓' : '—'}
              />
            </div>

            {/* fee / free card — driven by requiresPayment at submit time. During
                the free period we show the free card up front. */}
            <div className="free-card">
              <h4>{t(lang, 'postListing.feeFreeTitle')}</h4>
              <p>{t(lang, 'postListing.feeFreeBody')}</p>
            </div>

            <div className="review-note" style={{ marginTop: 16 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#5B6265" strokeWidth="2" width="16" height="16" style={{ flex: 'none' }}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
              {t(lang, 'postListing.reviewNote')}
            </div>

            {uploadProgress && (
              <p className="field-hint">
                {t(lang, 'postListing.uploadingPhotos', { done: uploadProgress.done, total: uploadProgress.total })}
              </p>
            )}
          </>
        )}

        {error && (
          <p style={{ color: '#8A3A3A', fontSize: 13, marginTop: 14 }}>{error}</p>
        )}

        {/* nav */}
        <div className="nav-buttons">
          {step > 0 && (
            <button className="btn btn-outline-dark" style={{ flex: 1 }} onClick={back} disabled={createListing.isPending || updateListing.isPending}>
              {t(lang, 'postListing.back')}
            </button>
          )}
          {step < TOTAL - 1 ? (
            <button className="btn btn-gold" style={{ flex: 2 }} onClick={next}>
              {t(lang, 'postListing.continue')}
            </button>
          ) : (
            <button className="btn btn-gold" style={{ flex: 2 }} onClick={submit} disabled={createListing.isPending || updateListing.isPending || initiatePayment.isPending}>
              {createListing.isPending || updateListing.isPending
                ? uploadProgress
                  ? t(lang, 'postListing.uploadingPhotos', { done: uploadProgress.done, total: uploadProgress.total })
                  : t(lang, 'postListing.submitting')
                : t(lang, isEdit ? 'postListing.saveChanges' : 'postListing.submitListing')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="review-row">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

function PropertyIcon({ type, selected }: { type: PropertyType; selected: boolean }) {
  const stroke = selected ? '#C9A24B' : '#14181A';
  const common = { fill: 'none', stroke, strokeWidth: 2 } as const;
  switch (type) {
    case 'HOUSE':
      return <svg viewBox="0 0 24 24" {...common}><path d="M3 11l9-7 9 7" /><path d="M5 10v9h14v-9" /></svg>;
    case 'APARTMENT':
      return <svg viewBox="0 0 24 24" {...common}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 8h1M14 8h1M9 13h1M14 13h1" /></svg>;
    case 'LAND':
      return <svg viewBox="0 0 24 24" {...common}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>;
    case 'COMMERCIAL':
      return <svg viewBox="0 0 24 24" {...common}><rect x="3" y="7" width="18" height="13" rx="1" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>;
  }
}
