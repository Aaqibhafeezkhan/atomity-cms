"use client";

import { formatBytes } from "@/lib/format";
import { ApiError } from "@/types/api";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/types/media";

/**
 * The backend's upload checks, run in the browser before sending so errors show
 * instantly. The backend still decides: it identifies the type from the file's bytes.
 */
export function validateImageFile(file: File): void {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new ApiError("UNSUPPORTED_TYPE", `${file.name}: only JPEG, PNG, WebP and GIF images are supported.`, 415);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ApiError("FILE_TOO_LARGE", `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_IMAGE_BYTES)}.`, 413);
  }
}
