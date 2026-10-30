import type { ContentDoc } from "./content";

export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const POST_STATUSES: PostStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

/* ── Content types (served by GET /api/v1/content-types) ─────────────── */

export type FieldType = "text" | "url" | "date" | "boolean" | "number" | "select";

/** One type-specific field, described by the backend; the editor renders it generically. */
export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  /** Required to publish — a draft may leave it empty. */
  required: boolean;
  /** Allowed values of a `select` field; empty for every other type. */
  options: string[];
}

export interface ContentTypeDefinition {
  key: string;
  displayName: string;
  description: string;
  /** Where items of this type end up. `route` is null while that's undecided. */
  destination: { label: string; route: string | null };
  fields: FieldDefinition[];
}

/** A stored field value, as the backend returns and accepts it. */
export type FieldValue = string | number | boolean;
export type PostFields = Record<string, FieldValue>;

/* ── Items ─────────────────────────────────────────────────────────── */

/** One row in the content list — everything except the body and the type-specific fields. */
export interface PostSummary {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt: string;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
}

export interface Post extends PostSummary {
  content: ContentDoc;
  fields: PostFields;
  /** Optimistic-locking counter: a save carrying a stale version is rejected with 409. */
  version: number;
  createdAt: string;
}

/** Body of create (`type`, no `version`) and update (`version`, no `type`). */
export interface PostInput {
  type?: string;
  title: string;
  slug?: string;
  excerpt: string;
  content: ContentDoc;
  fields: PostFields;
  version?: number;
}

export type PostSortKey = "updatedAt" | "title" | "publishedAt";

export interface PostListParams {
  type?: string;
  status?: PostStatus;
  q?: string;
  sort?: PostSortKey;
  direction?: "asc" | "desc";
  page?: number;
  size?: number;
}

/** Limits mirrored from the backend, for the editor's counters and validation. */
export const POST_LIMITS = {
  title: 200,
  slug: 160,
  excerpt: 300,
  /** Text and URL fields. */
  fieldText: 500,
  /** Number fields: whole numbers from 0 to this. */
  fieldNumber: 1_000_000,
} as const;
