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
  | 'ARCHIVED';

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

export type Language = 'en' | 'am';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface CurrentUser {
  id: string;
  phone: string;
  name: string | null;
  profilePhotoUrl: string | null;
  city: string | null;
  role: Role;
  verificationStatus: VerificationStatus;
  agencyName: string | null;
  createdAt: string;
}

export interface PublicUserCard {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  role: Role;
  agencyName: string | null;
  isVerifiedAgent: boolean;
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
  floor: string | null;
  furnished: boolean | null;
  amenities: string[];
  descriptionEn: string | null;
  descriptionAm: string | null;
  status: ListingStatus;
  viewCount: number;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  photos: ListingPhoto[];
  owner: {
    id: string;
    name: string;
    profilePhotoUrl: string | null;
    role: Role;
    agencyName: string | null;
    verificationStatus: VerificationStatus;
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
  floor?: string;
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
