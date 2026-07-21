import type { ApiClient } from './client';
import type { InitiatePaymentResponse, PaymentVerifyStatus } from '@koreb/types';

export interface PaymentReceipt {
  id: string;
  listingId: string;
  amountEtb: string;
  status: PaymentVerifyStatus;
  createdAt: string;
}

export function createPaymentsApi(client: ApiClient) {
  return {
    /**
     * Step 1 of the Chapa flow. The listing must already be AWAITING_PAYMENT
     * (call listings.submitForPayment first). Redirect the user's browser/
     * webview to the returned checkoutUrl next.
     */
    initiateListingPayment(listingId: string) {
      return client.request<InitiatePaymentResponse>('/payments/listing/initiate', {
        method: 'POST',
        body: { listingId },
      });
    },

    /**
     * Fallback check for when the user returns from Chapa's checkout — the
     * backend's webhook is the source of truth, but this lets the UI confirm
     * status immediately instead of waiting/polling blindly.
     */
    verify(txRef: string) {
      return client.request<{ status: PaymentVerifyStatus }>('/payments/verify', {
        method: 'POST',
        body: { txRef },
      });
    },

    myPayments() {
      return client.request<PaymentReceipt[]>('/payments/mine');
    },
  };
}
