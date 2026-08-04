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

    /**
     * Submits a DRAFT or REJECTED listing for publication.
     * The response's `requiresPayment` flag tells the frontend where to go next:
     *   false → straight to "Submitted, pending review" (current free period)
     *   true  → call payments.initiateListingPayment and send them to checkout
     * Build both paths regardless of the current fee setting.
     */
    submit(id: string) {
      return client.request<Listing & { requiresPayment: boolean }>(
        `/listings/${id}/submit`,
        { method: 'POST' }
      );
    },

    /** Resets the inactivity clock, bringing an UNPUBLISHED listing back to LIVE. */
    renew(id: string) {
      return client.request<Listing>(`/listings/${id}/renew`, { method: 'POST' });
    },

    /**
     * Marks a LIVE listing as sold or rented. No body — the backend derives
     * SOLD (from a SALE) or RENTED (from a RENT) itself, so no mismatch is possible.
     */
    markSoldRented(id: string) {
      return client.request<Listing>(`/listings/${id}/mark-sold-rented`, { method: 'POST' });
    },

    /** Reverses sold/rented back to LIVE (deal fell through, or tapped by mistake). */
    markAvailable(id: string) {
      return client.request<Listing>(`/listings/${id}/mark-available`, { method: 'POST' });
    },

    report(id: string, input: { reason: string; details?: string }) {
      return client.request<{ message: string }>(`/listings/${id}/report`, {
        method: 'POST',
        body: input,
      });
    },
  };
}
