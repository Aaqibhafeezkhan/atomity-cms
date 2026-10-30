import { EMPTY_DOC, isDocEmpty } from "@/lib/content";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import type { ContentDoc } from "@/types/content";
import {
  POST_LIMITS,
  type ContentTypeDefinition,
  type FieldDefinition,
  type Post,
  type PostFields,
  type PostInput,
} from "@/types/post";

/*
 * The editor's form state and everything that can be decided about it without a browser:
 * building it from the API, turning it back into a request, validating it, and spotting
 * unsaved changes. The type-specific "Details" are never hard-coded here; every function
 * works from the ContentTypeDefinition the backend serves, so a new type or field needs no
 * frontend change.
 */

/** What an input holds: text-like and number fields as strings, booleans as booleans. A missing key means "not set". */
export type FormFieldValue = string | boolean;
export type FormFields = Record<string, FormFieldValue>;

/** Everything the editor lets you change. */
export interface EditorForm {
  /** Key of the content type. Changeable only while creating. */
  type: string;
  title: string;
  slug: string;
  excerpt: string;
  content: ContentDoc;
  fields: FormFields;
}

export interface FormErrors {
  title?: string;
  slug?: string;
  excerpt?: string;
  /** By field name. */
  fields: Record<string, string>;
}

/** Something that stops an item from being published; `target` says which input to mark. */
export interface PublishProblem {
  target: "title" | "content" | { field: string };
  /** What is missing, worded to slot into "Add ___ before publishing", e.g. "the Department field". */
  missing: string;
}

// ── Choosing a type ─────────────────────────────────────────────────────

export function findType(types: ContentTypeDefinition[], key: string | null | undefined): ContentTypeDefinition | undefined {
  return types.find((type) => type.key === key);
}

/** "Career", falling back to the raw key when the type isn't (or isn't yet) known. */
export function typeLabel(types: ContentTypeDefinition[] | undefined, key: string): string {
  return findType(types ?? [], key)?.displayName ?? key;
}

/** The page a type's items are meant for, e.g. "Website · /news" or "Documentation · route to be decided". */
export function describeDestination(type: ContentTypeDefinition): string {
  return `${type.destination.label} · ${type.destination.route ?? "route to be decided"}`;
}

// ── Building the form ───────────────────────────────────────────────────

export function emptyForm(typeKey: string): EditorForm {
  return { type: typeKey, title: "", slug: "", excerpt: "", content: EMPTY_DOC, fields: {} };
}

/** A blank form for a new item of the given type. */
export function newForm(type: ContentTypeDefinition): EditorForm {
  return emptyForm(type.key);
}

/** Loads a stored value into the shape its input edits: numbers become digit strings. */
function toFormValue(field: FieldDefinition, value: unknown): FormFieldValue | undefined {
  if (field.type === "boolean") return typeof value === "boolean" ? value : undefined;
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value : undefined;
}

/** Only fields the type defines are loaded; anything else stored on the item is ignored. */
export function formFromPost(post: Post, type: ContentTypeDefinition | undefined): EditorForm {
  const fields: FormFields = {};
  for (const field of type?.fields ?? []) {
    const value = toFormValue(field, post.fields?.[field.name]);
    if (value !== undefined) fields[field.name] = value;
  }
  return { type: post.type, title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, fields };
}

/**
 * Switches a new item to another type. Values typed so far survive when the new type has a
 * field with the same name and kind; the rest are dropped so they can't leak into the request.
 */
export function changeType(form: EditorForm, next: ContentTypeDefinition): EditorForm {
  const fields: FormFields = {};
  for (const field of next.fields) {
    const value = form.fields[field.name];
    const fits = field.type === "boolean" ? typeof value === "boolean" : typeof value === "string";
    if (fits) fields[field.name] = value;
  }
  return { ...form, type: next.key, fields };
}

export function setField(form: EditorForm, name: string, value: FormFieldValue | undefined): EditorForm {
  const fields = { ...form.fields };
  if (value === undefined) delete fields[name];
  else fields[name] = value;
  return { ...form, fields };
}

// ── Slug ────────────────────────────────────────────────────────────────

/**
 * The slug follows the title until someone edits it by hand. An existing item keeps its own
 * slug unless it is still a draft whose slug was derived from its title: changing the title
 * of anything else must not move its URL.
 */
export function slugFollowsTitle(item: Pick<Post, "status" | "slug" | "title"> | null): boolean {
  return !item || (item.status === "DRAFT" && item.slug === slugify(item.title));
}

export function withTitle(form: EditorForm, title: string, followsTitle: boolean): EditorForm {
  return followsTitle ? { ...form, title, slug: slugify(title) } : { ...form, title };
}

/** Slugs are typed by hand: lowercase, no spaces. The pattern check does the rest. */
export function normalizeSlugInput(input: string): string {
  return input.toLowerCase().replace(/\s+/g, "-");
}

/**
 * The form once a save lands. Typing carries on while the request is in flight, so
 * `current` (what's on screen now) wins over `sent` (what was saved); only a slug the
 * server filled in for an empty one is taken over.
 */
export function formAfterSave(current: EditorForm, sent: EditorForm, savedSlug: string): EditorForm {
  return current.slug === sent.slug ? { ...current, slug: savedSlug } : current;
}

// ── Dirty check ─────────────────────────────────────────────────────────

/**
 * The form as a string, used to check for unsaved changes. Object keys are sorted first,
 * because Postgres JSONB stores the body with its keys in a different order from the one
 * Tiptap uses (arrays keep their order). Empty field values count as "not set", so typing
 * into a field and clearing it again isn't a change.
 */
export function snapshotOf(form: EditorForm): string {
  const fields = Object.fromEntries(Object.entries(form.fields).filter(([, value]) => value !== ""));
  return JSON.stringify(withSortedKeys({ ...form, fields }));
}

export function isDirty(form: EditorForm, saved: EditorForm | string): boolean {
  return snapshotOf(form) !== (typeof saved === "string" ? saved : snapshotOf(saved));
}

function withSortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withSortedKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, withSortedKeys(child)]),
    );
  }
  return value;
}

// ── The request ─────────────────────────────────────────────────────────

const WHOLE_NUMBER = /^\d+$/;

/** The typed value of one field, or undefined when it is empty and should be left out. */
function requestValue(field: FieldDefinition, value: FormFieldValue | undefined): PostFields[string] | undefined {
  if (field.type === "boolean") return typeof value === "boolean" ? value : undefined;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text) return undefined;
  if (field.type === "number") return WHOLE_NUMBER.test(text) ? Number(text) : undefined;
  return text;
}

/** The `fields` object of a request: only this type's fields, empty ones omitted, numbers as integers. */
export function requestFields(form: EditorForm, type: ContentTypeDefinition): PostFields {
  const fields: PostFields = {};
  for (const field of type.fields) {
    const value = requestValue(field, form.fields[field.name]);
    if (value !== undefined) fields[field.name] = value;
  }
  return fields;
}

/**
 * The create body (no `version`: carries the type) or the update body (carries the `version`
 * the editor loaded; the type is left out because it can't change). An empty slug is omitted
 * so the backend derives it from the title.
 */
export function toRequest(form: EditorForm, type: ContentTypeDefinition, version?: number): PostInput {
  const slug = form.slug.trim();
  return {
    ...(version === undefined ? { type: type.key } : { version }),
    title: form.title,
    ...(slug ? { slug } : {}),
    excerpt: form.excerpt,
    content: form.content,
    fields: requestFields(form, type),
  };
}

// ── Validation ──────────────────────────────────────────────────────────

function isRealDate(text: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isHttpUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "";
  } catch {
    return false;
  }
}

/** What is wrong with a field's current value, if anything. Empty is fine here: that only matters for publishing. */
function fieldFormatError(field: FieldDefinition, value: FormFieldValue | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text) return undefined;
  switch (field.type) {
    case "boolean":
      return undefined;
    case "text":
      return text.length > POST_LIMITS.fieldText ? `Keep it under ${POST_LIMITS.fieldText} characters.` : undefined;
    case "url":
      if (text.length > POST_LIMITS.fieldText) return `Keep it under ${POST_LIMITS.fieldText} characters.`;
      return isHttpUrl(text) ? undefined : "Must be a valid URL starting with http:// or https://.";
    case "date":
      return isRealDate(text) ? undefined : "Use a real date like 2026-12-31.";
    case "number":
      return WHOLE_NUMBER.test(text) && Number(text) <= POST_LIMITS.fieldNumber
        ? undefined
        : `Use a whole number from 0 to ${POST_LIMITS.fieldNumber.toLocaleString("en-GB")}.`;
    case "select":
      return field.options.includes(text) ? undefined : `Choose one of: ${field.options.join(", ")}.`;
  }
}

/** Checks run before saving; the API repeats them. Drafts may leave anything empty. */
export function validateForm(form: EditorForm, type: ContentTypeDefinition | undefined): FormErrors {
  const errors: FormErrors = { fields: {} };
  const slug = form.slug.trim();
  if (form.title.length > POST_LIMITS.title) errors.title = `Keep the title under ${POST_LIMITS.title} characters.`;
  if (slug && !SLUG_PATTERN.test(slug)) errors.slug = "Use lowercase letters, numbers and single hyphens only.";
  else if (slug.length > POST_LIMITS.slug) errors.slug = `Keep the slug under ${POST_LIMITS.slug} characters.`;
  if (form.excerpt.length > POST_LIMITS.excerpt) errors.excerpt = `Keep the excerpt under ${POST_LIMITS.excerpt} characters.`;
  for (const field of type?.fields ?? []) {
    const problem = fieldFormatError(field, form.fields[field.name]);
    if (problem) errors.fields[field.name] = problem;
  }
  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.title || errors.slug || errors.excerpt || Object.keys(errors.fields).length > 0);
}

/** A field counts as filled in once it has a value the backend would keep (blank text is dropped; `false` is a value). */
function isFilled(field: FieldDefinition, value: FormFieldValue | undefined): boolean {
  if (field.type === "boolean") return typeof value === "boolean";
  return typeof value === "string" && value.trim() !== "";
}

/**
 * What stops this item from being published, mirroring the backend's check (PostService.publish):
 * a title, some content (text or an image) and every required field of the type.
 */
export function publishProblems(form: EditorForm, type: ContentTypeDefinition | undefined): PublishProblem[] {
  const problems: PublishProblem[] = [];
  if (!form.title.trim()) problems.push({ target: "title", missing: "a title" });
  if (isDocEmpty(form.content)) problems.push({ target: "content", missing: "some content" });
  for (const field of type?.fields ?? []) {
    if (field.required && !isFilled(field, form.fields[field.name])) {
      problems.push({ target: { field: field.name }, missing: `the ${field.label} field` });
    }
  }
  return problems;
}

/** "a title", "a title and some content", "a title, some content and the Department field". */
export function joinMissing(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** The same sentence the backend uses for its 422, e.g. "Add a title and the Department field before publishing." */
export function describePublishProblems(problems: PublishProblem[]): string {
  return `Add ${joinMissing(problems.map((problem) => problem.missing))} before publishing.`;
}

/** The publish problem for one field, if it has one. */
export function fieldPublishProblem(problems: PublishProblem[], name: string): PublishProblem | undefined {
  return problems.find((problem) => typeof problem.target === "object" && problem.target.field === name);
}
