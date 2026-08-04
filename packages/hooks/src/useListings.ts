import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { ListingSearchParams, PaginatedListings } from '@koreb/types';
import { useKoreb } from './KorebProvider';

/** One place to build cache keys, so invalidating after a change is reliable. */
export const listingKeys = {
  all: ['listings'] as const,
  search: (params: ListingSearchParams) => ['listings', 'search', params] as const,
  detail: (id: string) => ['listings', 'detail', id] as const,
  mine: () => ['listings', 'mine'] as const,
  favorites: () => ['favorites'] as const,
};

/**
 * Home Feed / Search results, with "load more" paging.
 * Public endpoint — works whether or not the user is signed in.
 */
export function useListingsSearch(params: ListingSearchParams = {}) {
  const { api } = useKoreb();
  const pageSize = params.pageSize ?? 12;

  return useInfiniteQuery({
    queryKey: listingKeys.search({ ...params, pageSize }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.listings.search({ ...params, pageSize, page: pageParam as number }),
    getNextPageParam: (last: PaginatedListings) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
  });
}

export function useListing(id: string | undefined) {
  const { api } = useKoreb();
  return useQuery({
    queryKey: listingKeys.detail(id ?? ''),
    queryFn: () => api.listings.getById(id as string),
    enabled: Boolean(id),
  });
}

/** Favorited listing IDs as a Set, for quick "is this hearted?" checks in a list. */
export function useFavoriteIds(enabled = true) {
  const { api } = useKoreb();
  const query = useQuery({
    queryKey: listingKeys.favorites(),
    queryFn: () => api.favorites.list(),
    enabled,
    // A signed-out user gets a 401 here; treat that as "no favorites" rather
    // than an error the UI has to handle.
    retry: false,
  });

  const ids = new Set((query.data ?? []).map((f) => f.listing?.id).filter(Boolean) as string[]);
  return { ...query, ids };
}

/**
 * The full list of favorited listings (each with its listing object), for the
 * Favorites screen itself. Same underlying query/cache as useFavoriteIds, so
 * hearting/un-hearting on one screen updates the other with no extra fetch.
 */
export function useFavorites(enabled = true) {
  const { api } = useKoreb();
  return useQuery({
    queryKey: listingKeys.favorites(),
    queryFn: () => api.favorites.list(),
    enabled,
    retry: false,
  });
}

/**
 * Heart / un-heart a listing. Updates the UI immediately and rolls back if the
 * request fails — tapping a heart shouldn't feel laggy on a slow connection.
 */
export function useToggleFavorite() {
  const { api } = useKoreb();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) => {
      if (isFavorited) await api.favorites.remove(listingId);
      else await api.favorites.add(listingId);
      return { listingId, isFavorited: !isFavorited };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: listingKeys.favorites() });
    },
  });
}

/** Owner/Agent dashboard listings — every status, not just live ones. */
export function useMyListings(enabled = true) {
  const { api } = useKoreb();
  return useQuery({
    queryKey: listingKeys.mine(),
    queryFn: () => api.listings.myDashboard(),
    enabled,
  });
}

/** The public owner/agent card shown on a listing detail page. */
export function usePublicUser(userId: string | undefined) {
  const { api } = useKoreb();
  return useQuery({
    queryKey: ['users', 'public', userId ?? ''],
    queryFn: () => api.users.publicCard(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

/** Report a listing. Requires sign-in (the endpoint is auth-only). */
export function useReportListing() {
  const { api } = useKoreb();
  return useMutation({
    mutationFn: (input: { listingId: string; reason: string; details?: string }) =>
      api.listings.report(input.listingId, { reason: input.reason, details: input.details }),
  });
}

/** The signed-in user's own profile — used to gate posting (role, verification). */
export function useMe(enabled = true) {
  const { api } = useKoreb();
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.users.me(),
    enabled,
    retry: false,
  });
}

/**
 * Signs the user out: calls the backend logout endpoint, clears the stored
 * tokens, and resets the cached user + any per-account data (favorites, the
 * owner dashboard) so the UI flips to signed-out immediately with no stale data.
 */
export function useLogout() {
  const { api } = useKoreb();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      // Whether or not the network call succeeded, tokens are cleared locally,
      // so drop cached identity and account-scoped queries.
      qc.setQueryData(['users', 'me'], null);
      qc.removeQueries({ queryKey: ['users', 'me'] });
      qc.removeQueries({ queryKey: listingKeys.favorites() });
      qc.removeQueries({ queryKey: listingKeys.mine() });
    },
  });
}

/**
 * The whole Post-a-Listing submission, wrapped so the screen calls one thing.
 * Creates the draft, uploads each photo in order, then submits for review/payment.
 * Returns the created listing plus the requiresPayment flag from submit.
 */
export function useCreateListing() {
  const { api } = useKoreb();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      fields: import('@koreb/types').CreateListingInput;
      photos: { formData: FormData }[];
      onProgress?: (done: number, total: number) => void;
    }) => {
      const created = await api.listings.create(input.fields);

      // Photos upload one at a time (each is multipart) so we can report
      // progress and so one failure doesn't lose the others.
      let done = 0;
      for (const photo of input.photos) {
        await api.photos.upload(created.id, photo.formData);
        done += 1;
        input.onProgress?.(done, input.photos.length);
      }

      const submitted = await api.listings.submit(created.id);
      return submitted;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listingKeys.mine() });
      qc.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

/** Kicks off Chapa checkout for a listing that came back requiresPayment=true. */
export function useInitiatePayment() {
  const { api } = useKoreb();
  return useMutation({
    mutationFn: (listingId: string) => api.payments.initiateListingPayment(listingId),
  });
}

/** Delete / renew / resubmit an owner's own listing, refreshing their dashboard after. */
export function useManageMyListing() {
  const { api } = useKoreb();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: listingKeys.mine() });

  const remove = useMutation({
    mutationFn: (id: string) => api.listings.remove(id),
    onSuccess: invalidate,
  });
  const renew = useMutation({
    mutationFn: (id: string) => api.listings.renew(id),
    onSuccess: invalidate,
  });
  const resubmit = useMutation({
    mutationFn: (id: string) => api.listings.submit(id),
    onSuccess: invalidate,
  });
  const markSoldRented = useMutation({
    mutationFn: (id: string) => api.listings.markSoldRented(id),
    onSuccess: invalidate,
  });
  const markAvailable = useMutation({
    mutationFn: (id: string) => api.listings.markAvailable(id),
    onSuccess: invalidate,
  });
  return { remove, renew, resubmit, markSoldRented, markAvailable };
}

/**
 * Fetch one of the current user's OWN listings, at any status.
 * The public useListing only returns LIVE listings, so owner-preview and
 * admin-preview of not-yet-live listings must use this instead.
 */
export function useMyListing(id: string | undefined, enabled = true) {
  const { api } = useKoreb();
  return useQuery({
    queryKey: ['listings', 'mine', 'detail', id ?? ''],
    queryFn: () => api.listings.myListingById(id as string),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

/**
 * Edit an existing listing. Applies field changes, deletes any photos the user
 * removed, and uploads any new ones. On a REJECTED or LIVE listing, PATCH alone
 * re-queues it to AWAITING_REVIEW (per the API contract) — so no separate
 * submit call is needed.
 */
export function useUpdateListing() {
  const { api } = useKoreb();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      fields: import('@koreb/types').UpdateListingInput;
      removedPhotoIds?: string[];
      newPhotos?: { formData: FormData }[];
      onProgress?: (done: number, total: number) => void;
    }) => {
      await api.listings.update(input.id, input.fields);

      for (const photoId of input.removedPhotoIds ?? []) {
        await api.photos.remove(input.id, photoId);
      }

      const news = input.newPhotos ?? [];
      let done = 0;
      for (const p of news) {
        await api.photos.upload(input.id, p.formData);
        done += 1;
        input.onProgress?.(done, news.length);
      }

      return api.listings.myListingById(input.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listingKeys.mine() });
      qc.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}
