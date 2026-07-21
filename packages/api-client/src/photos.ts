import type { ApiClient } from './client';
import type { ListingPhoto } from '@koreb/types';

export function createPhotosApi(client: ApiClient) {
  return {
    /**
     * Upload one photo. Build the FormData in the calling app since the File/Blob
     * type differs between web (browser File input) and mobile (Expo ImagePicker
     * asset) — this function just needs a field named "file", matching the backend.
     * Max ~8MB, max 10 photos/listing (enforced by the backend).
     */
    upload(listingId: string, formData: FormData) {
      return client.request<ListingPhoto>(`/listings/${listingId}/photos`, {
        method: 'POST',
        formData,
      });
    },

    reorder(listingId: string, orderedPhotoIds: string[]) {
      return client.request<{ message: string }>(`/listings/${listingId}/photos/reorder`, {
        method: 'POST',
        body: { orderedPhotoIds },
      });
    },

    remove(listingId: string, photoId: string) {
      return client.request<{ message: string }>(
        `/listings/${listingId}/photos/${photoId}`,
        { method: 'DELETE' }
      );
    },
  };
}
