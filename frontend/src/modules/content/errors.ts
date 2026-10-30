import { ApiError } from "@/types/api";
import type { ContentTypeDefinition } from "@/types/post";

/** How the editor reacts to a failed request; `message` is always safe to show as is. */
export type FailureKind = "conflict" | "slug-taken" | "not-publishable" | "validation" | "other";

export interface Failure {
  kind: FailureKind;
  message: string;
}

export const CONFLICT_MESSAGE =
  "Someone saved a newer version of this item while you were editing. Reload to get the latest version — the changes you haven't saved here will be lost.";

/** The backend names fields as `fields.applyUrl`; people know them as "Apply URL". */
export function humanizeFieldNames(message: string, type: ContentTypeDefinition | undefined): string {
  return message.replace(/fields\.([A-Za-z0-9_]+)/g, (whole, name: string) => {
    const field = type?.fields.find((candidate) => candidate.name === name);
    return field ? `“${field.label}”` : whole;
  });
}

/** Maps an error from any api.ts call to what the editor should do and say. */
export function describeError(error: unknown, type?: ContentTypeDefinition): Failure {
  if (!(error instanceof ApiError)) {
    return { kind: "other", message: error instanceof Error ? error.message : "Something went wrong." };
  }
  switch (error.code) {
    case "VERSION_CONFLICT":
      return { kind: "conflict", message: CONFLICT_MESSAGE };
    case "SLUG_TAKEN":
      return { kind: "slug-taken", message: error.message };
    case "NOT_PUBLISHABLE":
      return { kind: "not-publishable", message: error.message };
    case "VALIDATION_ERROR":
      return { kind: "validation", message: humanizeFieldNames(error.message, type) };
    case "UNKNOWN_CONTENT_TYPE":
      return { kind: "other", message: "This content type doesn't exist (any more). Reload the page and pick another." };
    default:
      return { kind: "other", message: error.message };
  }
}
