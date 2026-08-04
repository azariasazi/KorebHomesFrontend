import type { Listing, Language, ListingRejectionCode } from '@koreb/types';

/**
 * The backend returns `priceEtb` as a STRING (it's a decimal column), so it
 * must be parsed before any formatting or maths. Doing this in one place
 * means no screen accidentally does string concatenation on a price.
 */
export function parsePriceEtb(listing: Pick<Listing, 'priceEtb'>): number {
  const n = Number(listing.priceEtb);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Formats a price the way it appears in the approved mockups:
 *   sale → "14,200,000 ETB"
 *   rent → "28,000 ETB / mo"
 * Amharic uses the same digits (Ethiopia uses Arabic numerals in listings)
 * but swaps the currency label to ብር.
 */
export function formatPrice(
  listing: Pick<Listing, 'priceEtb' | 'listingType'>,
  lang: Language = 'en'
): string {
  const amount = parsePriceEtb(listing).toLocaleString('en-US');
  const currency = lang === 'am' ? 'ብር' : 'ETB';
  const perMonth = listing.listingType === 'RENT' ? (lang === 'am' ? ' / ወር' : ' / mo') : '';
  return `${amount} ${currency}${perMonth}`;
}

/**
 * Photo URLs come back from the backend as relative paths like
 * "/uploads/listings/x.jpg". They need the API host in front of them to
 * actually load. In production these move to object storage and will already
 * be absolute — this handles both cases so nothing breaks at that point.
 *
 * Pass the same baseUrl the api client was configured with (it strips the
 * trailing /api/v1 itself).
 */
export function resolveMediaUrl(path: string | null | undefined, apiBaseUrl: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = apiBaseUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** First photo's thumbnail, ready to render — or null when a listing has no photos yet. */
/**
 * The card thumbnail. The detail endpoint returns a full `photos[]` array, but
 * list endpoints (search, dashboard) sometimes trim that down or expose the
 * cover image under a different field to keep responses light. So we check,
 * in order: an explicit cover/thumbnail field, then a `firstPhoto` object,
 * then the first entry of `photos[]`. Whichever the backend provides, we render.
 */
export function listingThumb(listing: Listing, apiBaseUrl: string): string | null {
  const anyListing = listing as Listing & {
    coverPhotoUrl?: string | null;
    thumbnailUrl?: string | null;
    firstPhoto?: { url?: string; thumbUrl?: string } | null;
  };

  // 1. explicit cover/thumbnail field, if the list endpoint provides one
  const direct = anyListing.coverPhotoUrl ?? anyListing.thumbnailUrl;
  if (direct) return resolveMediaUrl(direct, apiBaseUrl);

  // 2. a single firstPhoto object (as the favorites endpoint returns)
  if (anyListing.firstPhoto) {
    return resolveMediaUrl(anyListing.firstPhoto.thumbUrl ?? anyListing.firstPhoto.url, apiBaseUrl);
  }

  // 3. the full photos array (detail endpoint, or search if it includes them)
  const first = [...(listing.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return resolveMediaUrl(first?.thumbUrl ?? first?.url, apiBaseUrl);
}

/** "Bole, Addis Ababa" — falls back gracefully when sub-city is missing. */
export function locationLabel(listing: Pick<Listing, 'subCity' | 'city' | 'areaName'>): string {
  return [listing.subCity ?? listing.areaName, listing.city].filter(Boolean).join(', ');
}

/**
 * The small "3 Beds · 2 Baths · 180 m²" row.
 * Land and Commercial listings don't have bedrooms, so those are skipped
 * rather than rendered as "0 Beds".
 */
export function metaChips(listing: Listing, lang: Language = 'en'): string[] {
  const out: string[] = [];
  const bed = lang === 'am' ? 'መኝታ' : listing.bedrooms === 1 ? 'Bed' : 'Beds';
  const bath = lang === 'am' ? 'መታጠቢያ' : listing.bathrooms === 1 ? 'Bath' : 'Baths';

  if (listing.propertyType === 'LAND') out.push(lang === 'am' ? 'መሬት' : 'Land');
  if (listing.propertyType === 'COMMERCIAL') out.push(lang === 'am' ? ' commercial' : 'Commercial');
  if (listing.bedrooms) out.push(`${listing.bedrooms} ${bed}`);
  if (listing.bathrooms) out.push(`${listing.bathrooms} ${bath}`);
  if (listing.sizeSqm) out.push(`${listing.sizeSqm} m²`);
  return out;
}

/** "FOR RENT" / "FOR SALE" pill text. */
export function listingTypeLabel(
  listing: Pick<Listing, 'listingType'>,
  lang: Language = 'en'
): string {
  if (lang === 'am') return listing.listingType === 'RENT' ? 'ለኪራይ' : 'ለሽያጭ';
  return listing.listingType === 'RENT' ? 'FOR RENT' : 'FOR SALE';
}

/** Description in the user's language, falling back to whichever exists. */
export function listingDescription(listing: Listing, lang: Language = 'en'): string {
  const primary = lang === 'am' ? listing.descriptionAm : listing.descriptionEn;
  return primary ?? listing.descriptionEn ?? listing.descriptionAm ?? '';
}

/**
 * Listings don't have a title field on the backend — the mockups show one
 * ("Modern 3BR Apartment"), so we compose it from the structured fields.
 * Worth revisiting if you'd rather owners type their own headline.
 */
export function listingTitle(listing: Listing, lang: Language = 'en'): string {
  if (lang === 'am') {
    const typeAm: Record<string, string> = {
      HOUSE: 'ቤት',
      APARTMENT: 'አፓርታማ',
      LAND: 'መሬት',
      COMMERCIAL: 'የንግድ ቦታ',
    };
    const beds = listing.bedrooms ? `${listing.bedrooms} መኝታ ` : '';
    return `${beds}${typeAm[listing.propertyType] ?? ''}`.trim();
  }
  const typeEn: Record<string, string> = {
    HOUSE: 'House',
    APARTMENT: 'Apartment',
    LAND: 'Land',
    COMMERCIAL: 'Commercial Space',
  };
  const beds = listing.bedrooms ? `${listing.bedrooms}BR ` : '';
  const furnished = listing.furnished ? 'Furnished ' : '';
  return `${furnished}${beds}${typeEn[listing.propertyType] ?? ''}`.trim();
}

// ---------------------------------------------------------------------------
// Floor
// ---------------------------------------------------------------------------

/** "Ground floor", "Basement", "4th floor" — from the numeric floorNumber. */
export function floorLabel(
  listing: Pick<Listing, 'floorNumber' | 'floor'>,
  lang: Language = 'en'
): string | null {
  const n = listing.floorNumber;
  if (n === null || n === undefined) {
    // During the backend transition some old listings may still only have the
    // deprecated free-text floor — fall back to it rather than showing nothing.
    return listing.floor ?? null;
  }
  if (lang === 'am') {
    if (n === 0) return 'ምድር ወለል';
    if (n === -1) return 'ምድር ቤት';
    return `${n}ኛ ፎቅ`;
  }
  if (n === 0) return 'Ground floor';
  if (n === -1) return 'Basement';
  const ord =
    n % 10 === 1 && n % 100 !== 11 ? 'st'
    : n % 10 === 2 && n % 100 !== 12 ? 'nd'
    : n % 10 === 3 && n % 100 !== 13 ? 'rd'
    : 'th';
  return `${n}${ord} floor`;
}

// ---------------------------------------------------------------------------
// Amenities — the backend stores raw keys like "water_tank"; these are the
// human labels. Unknown keys fall back to a title-cased version so a new
// backend amenity still renders acceptably before this map is updated.
// ---------------------------------------------------------------------------

const AMENITY_LABELS: Record<string, { en: string; am: string }> = {
  parking: { en: 'Parking', am: 'የመኪና ማቆሚያ' },
  water_tank: { en: 'Water tank', am: 'የውሃ ማጠራቀሚያ' },
  generator: { en: 'Generator', am: 'ጄነሬተር' },
  security: { en: '24/7 Security', am: 'የ24 ሰዓት ጥበቃ' },
  elevator: { en: 'Elevator', am: 'አሳንሰር' },
  balcony: { en: 'Balcony', am: 'በረንዳ' },
  furnished: { en: 'Furnished', am: ' የተሟላ ዕቃ' },
  wifi: { en: 'Wi-Fi ready', am: 'ዋይፋይ' },
  ac: { en: 'Air conditioning', am: 'ኤር ኮንዲሽን' },
  hot_water: { en: 'Hot water', am: 'ሙቅ ውሃ' },
  gym: { en: 'Gym', am: 'ጂም' },
  pool: { en: 'Swimming pool', am: 'የመዋኛ ገንዳ' },
  garden: { en: 'Garden', am: 'የአትክልት ስፍራ' },
  private_entrance: { en: 'Private entrance', am: 'የግል መግቢያ' },
};

export function amenityLabel(key: string, lang: Language = 'en'): string {
  const found = AMENITY_LABELS[key];
  if (found) return lang === 'am' ? found.am : found.en;
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Rejection reasons — human-readable label for each structured code.
// ---------------------------------------------------------------------------

const REJECTION_LABELS: Record<ListingRejectionCode, { en: string; am: string }> = {
  DUPLICATE: { en: 'Duplicate listing', am: 'ተደጋጋሚ ማስታወቂያ' },
  SUSPECTED_FRAUD: { en: 'Suspected fraud', am: 'የማጭበርበር ጥርጣሬ' },
  POOR_PHOTOS: { en: 'Poor photo quality', am: 'ደካማ የፎቶ ጥራት' },
  INCOMPLETE_DETAILS: { en: 'Incomplete details', am: 'ያልተሟላ መረጃ' },
  PRICE_IMPLAUSIBLE: { en: 'Unrealistic price', am: 'ተገቢ ያልሆነ ዋጋ' },
  PROHIBITED_CONTENT: { en: 'Prohibited content', am: 'የተከለከለ ይዘት' },
  WRONG_CATEGORY: { en: 'Wrong category', am: 'የተሳሳተ ምድብ' },
  OTHER: { en: 'Other', am: 'ሌላ' },
};

export function rejectionLabel(code: ListingRejectionCode, lang: Language = 'en'): string {
  const found = REJECTION_LABELS[code];
  return found ? (lang === 'am' ? found.am : found.en) : code;
}

// ---------------------------------------------------------------------------
// Contact links (Call / WhatsApp / Telegram) built from a phone number.
//
// NOTE: as of API-REFERENCE.md the listing's owner object does NOT expose a
// phone number, so these can't be populated yet — see backend change request.
// Written now so the Listing Detail contact buttons light up the moment the
// backend adds a contact number, with zero screen changes.
// ---------------------------------------------------------------------------

/** Normalizes an Ethiopian number to E.164 digits for tel:/wa.me links. */
export function normalizeEthiopianPhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('0')) return `251${digits.slice(1)}`;
  if (digits.length === 9) return `251${digits}`;
  return digits;
}

export function contactLinks(phone: string | null | undefined) {
  if (!phone) return null;
  const intl = normalizeEthiopianPhone(phone);
  return {
    call: `tel:+${intl}`,
    whatsapp: `https://wa.me/${intl}`,
    telegram: `https://t.me/+${intl}`,
  };
}
export * from './options';

// ---------------------------------------------------------------------------
// Floor options for the Post-a-Listing dropdown.
// Values are the numbers the backend stores (-1 basement, 0 ground, 1+ upper),
// so ground and basement are finally selectable — plain number inputs
// couldn't express them. Labels reuse floorLabel for consistency.
// ---------------------------------------------------------------------------

export function floorOptions(lang: Language = 'en', maxFloor = 40): { value: number; label: string }[] {
  const opts: { value: number; label: string }[] = [];
  for (let n = -1; n <= maxFloor; n++) {
    opts.push({ value: n, label: floorLabel({ floorNumber: n, floor: null }, lang) ?? String(n) });
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Listing status → display color, for dashboard status badges.
// ---------------------------------------------------------------------------

import type { ListingStatus } from '@koreb/types';

export function statusColor(status: ListingStatus): { bg: string; fg: string } {
  switch (status) {
    case 'LIVE':
      return { bg: 'rgba(59,109,48,0.12)', fg: '#3B6D30' };
    case 'AWAITING_REVIEW':
      return { bg: '#F1E6CC', fg: '#A8823A' };
    case 'AWAITING_PAYMENT':
      return { bg: '#F1E6CC', fg: '#A8823A' };
    case 'REJECTED':
      return { bg: '#E3C6C6', fg: '#8A3A3A' };
    case 'UNPUBLISHED':
      return { bg: 'rgba(20,24,26,0.08)', fg: '#5B6265' };
    case 'SOLD':
    case 'RENTED':
      return { bg: 'rgba(20,24,26,0.75)', fg: '#F6F3EC' };
    case 'DRAFT':
      return { bg: 'rgba(20,24,26,0.06)', fg: '#8A9093' };
    default:
      return { bg: 'rgba(20,24,26,0.06)', fg: '#8A9093' };
  }
}

/** True when a listing has been marked sold or rented (still visible, but closed). */
export function isSoldOrRented(listing: Pick<Listing, 'status'>): boolean {
  return listing.status === 'SOLD' || listing.status === 'RENTED';
}

/** "SOLD" / "RENTED" overlay label for public cards and detail. */
export function soldRentedLabel(listing: Pick<Listing, 'status'>, lang: Language = 'en'): string | null {
  if (listing.status === 'SOLD') return lang === 'am' ? 'ተሽጧል' : 'SOLD';
  if (listing.status === 'RENTED') return lang === 'am' ? 'ተከራይቷል' : 'RENTED';
  return null;
}
