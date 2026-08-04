import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ListingRejectionCode, Role } from '@koreb/types';
import { useKoreb } from './KorebProvider';

export const adminKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  reviewQueue: (page: number) => ['admin', 'review-queue', page] as const,
  users: (role?: Role) => ['admin', 'users', role ?? 'all'] as const,
  verificationQueue: ['admin', 'verification-queue'] as const,
  reports: (status?: string) => ['admin', 'reports', status ?? 'all'] as const,
  settings: ['admin', 'settings'] as const,
};

export function useAdminDashboard() {
  const { api } = useKoreb();
  return useQuery({ queryKey: adminKeys.dashboard, queryFn: () => api.admin.dashboard() });
}

export function useReviewQueue(page = 1, pageSize = 20) {
  const { api } = useKoreb();
  return useQuery({
    queryKey: adminKeys.reviewQueue(page),
    queryFn: () => api.admin.reviewQueue(page, pageSize),
  });
}

/** Approve / reject a listing, refreshing the queue and dashboard counts after. */
export function useModerateListing() {
  const { api } = useKoreb();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
    qc.invalidateQueries({ queryKey: adminKeys.dashboard });
  };

  const approve = useMutation({
    mutationFn: (id: string) => api.admin.approveListing(id),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: (input: { id: string; code: ListingRejectionCode; note?: string }) =>
      api.admin.rejectListing(input.id, input.code, input.note),
    onSuccess: invalidate,
  });

  return { approve, reject };
}

export function useAdminUsers(role?: Role) {
  const { api } = useKoreb();
  return useQuery({ queryKey: adminKeys.users(role), queryFn: () => api.admin.users(role) });
}

export function useModerateUser() {
  const { api } = useKoreb();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] });

  const suspend = useMutation({
    mutationFn: (input: { id: string; reason: string }) => api.admin.suspendUser(input.id, input.reason),
    onSuccess: invalidate,
  });
  const unsuspend = useMutation({
    mutationFn: (id: string) => api.admin.unsuspendUser(id),
    onSuccess: invalidate,
  });
  return { suspend, unsuspend };
}

export function useVerificationQueue() {
  const { api } = useKoreb();
  return useQuery({ queryKey: adminKeys.verificationQueue, queryFn: () => api.admin.verificationQueue() });
}

export function useModerateVerification() {
  const { api } = useKoreb();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: adminKeys.verificationQueue });
    qc.invalidateQueries({ queryKey: adminKeys.dashboard });
  };

  const approve = useMutation({
    mutationFn: (userId: string) => api.admin.approveVerification(userId),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: (input: { userId: string; reason: string }) =>
      api.admin.rejectVerification(input.userId, input.reason),
    onSuccess: invalidate,
  });
  return { approve, reject };
}

export function useAdminReports(status?: 'OPEN' | 'REVIEWED' | 'DISMISSED') {
  const { api } = useKoreb();
  return useQuery({ queryKey: adminKeys.reports(status), queryFn: () => api.admin.reports(status) });
}

export function useResolveReport() {
  const { api } = useKoreb();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: 'REVIEWED' | 'DISMISSED'; note?: string }) =>
      api.admin.resolveReport(input.id, { status: input.status, note: input.note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useAdminSettings() {
  const { api } = useKoreb();
  return useQuery({ queryKey: adminKeys.settings, queryFn: () => api.admin.settings() });
}

export function useUpdateSetting() {
  const { api } = useKoreb();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { key: string; value: string }) => api.admin.updateSetting(input.key, input.value),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.settings }),
  });
}
