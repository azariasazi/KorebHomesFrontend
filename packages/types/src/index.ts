// ============================================================================
// Shared types — kept in exact lockstep with API-REFERENCE.md.
// If the backend contract changes, update it here FIRST, then both apps
// get the corrected shape automatically (TypeScript will flag anywhere
// that now breaks).
// ============================================================================

export type Role = 'BUYER_RENTER' | 'OWNER' | 'AGENT' | 'ADMIN';

export type VerificationStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type PropertyType = 'HOUSE' | 'APARTMENT' | 'LAND' | 'COMMERCIAL';

export type ListingType = 'SALE' | 'RENT';

export type ListingStatus =
  | 'DRAFT'
  | 'AWAITING_PAYMENT'
  | 'AWAITING_REVIEW'
  | 'LIVE'
  | 'REJECTED'
  | 'UNPUBLISHED'
  | 'SOLD'
  | 'RENTED'
  | 'ARCHIVED';

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

/** Structured rejection reasons — set by admin, shown to the owner on their dashboard. */
export type ListingRejectionCode =
  | 'DUPLICATE'
  | 'SUSPECTED_FRAUD'
  | 'POOR_PHOTOS'
  | 'INCOMPLETE_DETAILS'
  | 'PRICE_IMPLAUSIBLE'
  | 'PROHIBITED_CONTENT'
  | 'WRONG_CATEGORY'
  | 'OTHER';

export type Language = 'en' | 'am';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface CurrentUser {
  id: string;
  /** Login identifier. May be null for a Google-first user who hasn't added one yet. */
  phone: string | null;
  /** True once the phone has been confirmed via SMS. */
  phoneVerified: boolean;
  /** Login identifier / verification channel. Null if the user never added one. */
  email: string | null;
  /** True once the email has been confirmed. */
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  /** Composed display name, kept in sync with firstName/lastName by the backend. */
  name: string | null;
  profilePhotoUrl: string | null;
  city: string | null;
  role: Role;
  verificationStatus: VerificationStatus;
  agencyName: string | null;
  /** The number the user chose to show publicly, or null if unset. */
  publicContactPhone: string | null;
  /** What actually shows on their listings now: public number if set, else account phone. */
  effectiveContactPhone: string | null;
  /** True when the user has linked a Google account. */
  hasGoogleLinked: boolean;
  /** True when phone is null — the user must verify a phone before posting a listing. */
  needsPhone: boolean;
  /** Present on admin user lists — lets the admin table show a Suspended badge. */
  isSuspended?: boolean;
  suspendedReason?: string | null;
  suspendedAt?: string | null;
  createdAt: string;
}

export interface PublicUserCard {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  role: Role;
  agencyName: string | null;
  isVerifiedAgent: boolean;
  /** Number for Call/WhatsApp links: public contact if set, else account phone. */
  contactPhone: string | null;
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface ListingPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  sortOrder: number;
}

export interface Listing {
  id: string;
  ownerId: string;
  propertyType: PropertyType;
  listingType: ListingType;
  /** Comes back from the API as a STRING (it's a decimal) — parse before doing math on it. */
  priceEtb: string;
  region: string;
  city: string;
  subCity: string | null;
  areaName: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;

  // --- Building / unit identification (Change Request 01) ---
  /** PUBLIC. e.g. "Zefmesh Grand". Optional for all types. */
  buildingName: string | null;
  /** PUBLIC. -1 = basement, 0 = ground, 1+ = upper floors. Use this, not `floor`. */
  floorNumber: number | null;
  /**
   * PRIVATE. e.g. "4B". Present ONLY on the owner's own listings and admin
   * responses — the key is absent entirely on public endpoints, so it's
   * optional here rather than nullable.
   */
  unitNumber?: string;
  /** @deprecated Old free-text floor. Kept during transition; build against `floorNumber`. */
  floor: string | null;

  furnished: boolean | null;
  amenities: string[];
  descriptionEn: string | null;
  descriptionAm: string | null;
  status: ListingStatus;
  viewCount: number;
  isFeatured: boolean;
  publishedAt: string | null;
  /** Set when an owner marks a LIVE listing sold/rented; null otherwise. */
  soldRentedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // --- Rejection detail (PRIVATE — owner's own listing / admin only) ---
  rejectionCode?: ListingRejectionCode | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;

  photos: ListingPhoto[];
  owner: {
    id: string;
    name: string;
    profilePhotoUrl: string | null;
    role: Role;
    agencyName: string | null;
    verificationStatus: VerificationStatus;
    /** Present on public listing responses — build Call/WhatsApp from this. */
    contactPhone: string | null;
  };
}

export interface PaginatedListings {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListingSearchParams {
  city?: string;
  subCity?: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
  keyword?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

/** Body for POST /listings — only these four fields are actually required. */
export interface CreateListingInput {
  propertyType: PropertyType;
  listingType: ListingType;
  priceEtb: number;
  region: string;
  city: string;
  subCity?: string;
  areaName?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  buildingName?: string;
  /** Required when propertyType === 'APARTMENT'. Captured but never shown publicly. */
  unitNumber?: string;
  floorNumber?: number;
  furnished?: boolean;
  amenities?: string[];
  descriptionEn?: string;
  descriptionAm?: string;
}

export type UpdateListingInput = Partial<CreateListingInput>;

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export interface InitiatePaymentResponse {
  paymentId: string;
  checkoutUrl: string;
  amountEtb: number;
}

export type PaymentVerifyStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminDashboardStats {
  totalListings: number;
  totalUsers: number;
  awaitingReview: number;
  revenueCollectedEtb: number;
  openReports: number;
}

export interface AdminSetting {
  key: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Generic API error shape (matches every error response from the backend)
// ---------------------------------------------------------------------------

export interface ApiErrorShape {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}
