import type { ApiClient } from './client';
import type {
  Listing,
  PaginatedListings,
  ListingSearchParams,
  CreateListingInput,
  UpdateListingInput,
} from '@koreb/types';

export function createListingsApi(client: ApiClient) {
  return {
    /** Public — no login required. Only ever returns LIVE listings. Powers Home Feed + Search/Filters. */
    search(params: ListingSearchParams = {}) {
      return client.request<PaginatedListings>('/listings', {
        authenticated: false,
        query: params as Record<string, string | number | boolean | undefined>,
      });
    },

    /** Public. Only returns LIVE listings; increments the view count server-side. */
    getById(id: string) {
      return client.request<Listing>(`/listings/${id}`, { authenticated: false });
    },

    /** OWNER or AGENT only. Starts life as DRAFT. */
    create(input: CreateListingInput) {
      return client.request<Listing>('/listings', { method: 'POST', body: input });
    },

    /** Editing a LIVE listing sends it back to AWAITING_REVIEW — worth warning the user about in the UI. */
    update(id: string, input: UpdateListingInput) {
      return client.request<Listing>(`/listings/${id}`, { method: 'PATCH', body: input });
    },

    remove(id: string) {
      return client.request<{ message: string }>(`/listings/${id}`, { method: 'DELETE' });
    },

    /** Powers the Owner/Agent Dashboard — every status, not just LIVE. */
    myDashboard() {
      return client.request<Listing[]>('/listings/mine/dashboard');
    },

    myListingById(id: string) {
      return client.request<Listing>(`/listings/mine/${id}`);
    },

    /** Moves a DRAFT or REJECTED listing to AWAITING_PAYMENT — call before initiating payment. */
    submitForPayment(id: string) {
      return client.request<Listing>(`/listings/${id}/submit-for-payment`, { method: 'POST' });
    },

    /** Resets the inactivity clock, bringing an UNPUBLISHED listing back to LIVE. */
    renew(id: string) {
      return client.request<Listing>(`/listings/${id}/renew`, { method: 'POST' });
    },

    report(id: string, input: { reason: string; details?: string }) {
      return client.request<{ message: string }>(`/listings/${id}/report`, {
        method: 'POST',
        body: input,
      });
    },
  };
}
