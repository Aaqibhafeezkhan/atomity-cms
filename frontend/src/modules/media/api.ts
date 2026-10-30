"use client";

import { api, apiJson, apiRequest } from "@/lib/api-client";
import type { Media } from "@/types/media";
import { validateImageFile } from "./upload";

/* Media API — thin wrappers over the backend's /api/v1/media endpoints. */

/** GET /api/v1/media — newest first. */
export function listMedia(): Promise<Media[]> {
  return api("GET", "/media");
}

/**
 * POST /api/v1/media (multipart, field `file`). The same type/size checks the
 * backend applies run here first, so obvious mistakes fail instantly.
 */
export async function uploadMedia(file: File): Promise<Media> {
  validateImageFile(file);
  const form = new FormData();
  form.append("file", file);
  // No Content-Type header: the browser sets the multipart boundary itself.
  return (await apiRequest<Media>("/media", { method: "POST", body: form })).data;
}

/** PATCH /api/v1/media/{id} */
export function updateMediaAlt(id: string, altText: string): Promise<Media> {
  return apiJson("PATCH", `/media/${id}`, { altText });
}

/** DELETE /api/v1/media/{id} — refused (409) while any content item still uses the image. */
export async function deleteMedia(id: string): Promise<void> {
  await api("DELETE", `/media/${id}`);
}
