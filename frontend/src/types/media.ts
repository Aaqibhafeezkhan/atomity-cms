export interface Media {
  id: string;
  /** URL the image is served from. */
  url: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
  altText: string;
  /** How many content items reference this image — deleting is blocked while > 0. */
  usageCount: number;
  createdAt: string;
}

/** An image as embedded in a post or author. */
export interface MediaRef {
  id: string;
  url: string;
  altText: string;
}

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
