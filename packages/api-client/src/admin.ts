import type { ApiClient } from './client';
import type {
  AdminDashboardStats,
  AdminSetting,
  Listing,
  PaginatedListings,
  Role,
  CurrentUser,
  VerificationStatus,
} from '@koreb/types';

export interface AdminReport {
  id: string;
  listingId: string;
  reason: string;
  details: string | null;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED';
  createdAt: string;
}

export interface AgentVerificationRequest {
  userId: string;
  name: string;
  agencyName: string | null;
  documentUrl: string;
  status: VerificationStatus;
  submittedAt: string;
}

/**
 * Every method here requires the ADMIN role on the backend — a non-admin
 * token gets a 403. Only wire these into the Admin Panel routes, never into
 * the public web/mobile apps.
 */
export function createAdminApi(client: ApiClient) {
  return {
    dashboard() {
      return client.request<AdminDashboardStats>('/admin/dashboard');
    },

    reviewQueue(page = 1, pageSize = 20) {
      return client.request<PaginatedListings>('/admin/listings/review-queue', {
        query: { page, pageSize },
      });
    },

    approveListing(id: string) {
      return client.request<Listing>(`/admin/listings/${id}/approve`, { method: 'POST' });
    },

    rejectListing(id: string, reason: string) {
      return client.request<Listing>(`/admin/listings/${id}/reject`, {
        method: 'POST',
        body: { reason },
      });
    },

    users(role?: Role) {
      return client.request<CurrentUser[]>('/admin/users', { query: { role } });
    },

    suspendUser(id: string, reason: string) {
      return client.request<{ message: string }>(`/admin/users/${id}/suspend`, {
        method: 'POST',
        body: { reason },
      });
    },

    unsuspendUser(id: string) {
      return client.request<{ message: string }>(`/admin/users/${id}/unsuspend`, {
        method: 'POST',
      });
    },

    verificationQueue() {
      return client.request<AgentVerificationRequest[]>('/admin/verification/queue');
    },

    approveVerification(userId: string) {
      return client.request<{ message: string }>(`/admin/verification/${userId}/approve`, {
        method: 'POST',
      });
    },

    rejectVerification(userId: string, reason: string) {
      return client.request<{ message: string }>(`/admin/verification/${userId}/reject`, {
        method: 'POST',
        body: { reason },
      });
    },

    reports(status?: 'OPEN' | 'REVIEWED' | 'DISMISSED') {
      return client.request<AdminReport[]>('/admin/reports', { query: { status } });
    },

    resolveReport(id: string, input: { status: 'REVIEWED' | 'DISMISSED'; note?: string }) {
      return client.request<{ message: string }>(`/admin/reports/${id}/resolve`, {
        method: 'POST',
        body: input,
      });
    },

    settings() {
      return client.request<AdminSetting[]>('/admin/settings');
    },

    /** e.g. updateSetting('listing_fee_etb', '300') to change the fee without a code deploy. */
    updateSetting(key: string, value: string) {
      return client.request<AdminSetting>(`/admin/settings/${key}`, {
        method: 'PATCH',
        body: { value },
      });
    },
  };
}
