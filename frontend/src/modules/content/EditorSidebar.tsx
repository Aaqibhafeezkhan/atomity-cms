"use client";

import { RefreshCw } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { PostStatusChip } from "@/components/ui/StatusChip";
import { Switch } from "@/components/ui/Switch";
import { TypeChip } from "@/components/ui/TypeChip";
import { formatDateTime, pluralize } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { POST_LIMITS, type ContentTypeDefinition, type FieldDefinition, type PostStatus } from "@/types/post";
import {
  fieldPublishProblem,
  normalizeSlugInput,
  type EditorForm,
  type FormErrors,
  type FormFieldValue,
  type PublishProblem,
} from "./form";

export interface EditorMeta {
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface EditorSidebarProps {
  form: EditorForm;
  /** The form's type; undefined only if the saved type is no longer served by the backend. */
  type: ContentTypeDefinition | undefined;
  /** All types, for the selector shown while creating. */
  types: ContentTypeDefinition[];
  /** False for an existing item: its type is shown, not editable. */
  typeEditable: boolean;
  errors: FormErrors;
  /** Server-side complaint about the slug (already taken), shown until it is edited. */
  slugError?: string;
  /** What blocks publishing; its messages are shown on the fields once `showPublishProblems` is set. */
  problems: PublishProblem[];
  showPublishProblems: boolean;
  meta: EditorMeta;
  wordCount: number;
  onTypeChange: (key: string) => void;
  onExcerptChange: (excerpt: string) => void;
  onSlugChange: (slug: string) => void;
  /** Regenerate the slug from the title (and follow it again). */
  onSlugFromTitle: (slug: string) => void;
  onFieldChange: (name: string, value: FormFieldValue | undefined) => void;
}

export function EditorSidebar(props: EditorSidebarProps) {
  const { form, type, types, typeEditable, errors, problems, showPublishProblems, meta, wordCount } = props;
  return (
    <div className="flex flex-col gap-3">
      {typeEditable && <TypePanel types={types} value={form.type} onChange={props.onTypeChange} />}
      <SummaryPanel type={type} typeKey={form.type} meta={meta} wordCount={wordCount} />
      {type && <DestinationPanel type={type} />}
      <UrlPanel
        form={form}
        type={type}
        error={props.slugError ?? errors.slug}
        errorExcerpt={errors.excerpt}
        status={meta.status}
        onSlugChange={props.onSlugChange}
        onSlugFromTitle={props.onSlugFromTitle}
        onExcerptChange={props.onExcerptChange}
      />
      {type && (
        <DetailsPanel
          type={type}
          form={form}
          errors={errors}
          problems={problems}
          showPublishProblems={showPublishProblems}
          onChange={props.onFieldChange}
        />
      )}
    </div>
  );
}

// ── Type ────────────────────────────────────────────────────────────────

function TypePanel({ types, value, onChange }: { types: ContentTypeDefinition[]; value: string; onChange: (key: string) => void }) {
  const selected = types.find((type) => type.key === value);
  return (
    <Panel title="Content type" bodyClassName="flex flex-col gap-2">
      <Select
        id="content-type"
        aria-label="Content type"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={types.map((type) => ({ value: type.key, label: type.displayName }))}
      />
      {selected && <p className="text-[11.5px] text-muted">{selected.description}</p>}
      <p className="text-[11px] text-muted">The type is fixed once the item is saved.</p>
    </Panel>
  );
}

// ── Summary ─────────────────────────────────────────────────────────────

function SummaryPanel({
  type,
  typeKey,
  meta,
  wordCount,
}: {
  type: ContentTypeDefinition | undefined;
  typeKey: string;
  meta: EditorMeta;
  wordCount: number;
}) {
  const rows: [string, React.ReactNode][] = [
    ["Status", <PostStatusChip key="status" status={meta.status} />],
    ["Type", <TypeChip key="type">{type?.displayName ?? typeKey}</TypeChip>],
    ["Published", meta.publishedAt ? formatDateTime(meta.publishedAt) : "Never"],
    ["Last saved", meta.updatedAt ? formatDateTime(meta.updatedAt) : "Not saved yet"],
    ["Length", pluralize(wordCount, "word")],
  ];
  return (
    <Panel title="Summary">
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-[12.5px]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

// ── Destination ─────────────────────────────────────────────────────────

/** Descriptive only: says where items of this type are meant to appear. Nothing here publishes a page. */
function DestinationPanel({ type }: { type: ContentTypeDefinition }) {
  return (
    <Panel title="Destination" bodyClassName="flex flex-col gap-1">
      <div className="text-[13px] font-semibold">{type.destination.label}</div>
      {type.destination.route ? (
        <div className="font-mono text-[12px]">{type.destination.route}</div>
      ) : (
        <div className="text-[12px] text-muted italic">Route to be decided</div>
      )}
      <p className="mt-1 text-[11px] text-muted">Where {type.displayName.toLowerCase()} items are meant to appear.</p>
    </Panel>
  );
}

// ── URL & excerpt ───────────────────────────────────────────────────────

function UrlPanel({
  form,
  type,
  error,
  errorExcerpt,
  status,
  onSlugChange,
  onSlugFromTitle,
  onExcerptChange,
}: {
  form: EditorForm;
  type: ContentTypeDefinition | undefined;
  error: string | undefined;
  errorExcerpt: string | undefined;
  status: PostStatus;
  onSlugChange: (slug: string) => void;
  onSlugFromTitle: (slug: string) => void;
  onExcerptChange: (excerpt: string) => void;
}) {
  const fromTitle = slugify(form.title);
  const prefix = `${type?.destination.route ?? ""}/`;
  return (
    <Panel title="URL & excerpt" bodyClassName="flex flex-col gap-4">
      <Field
        label="Slug"
        htmlFor="slug"
        error={error}
        hint={status === "PUBLISHED" ? "Changing the slug of published content breaks existing links to it." : "Unique within its type."}
      >
        <div className="flex gap-1.5">
          <div className="input flex items-center gap-0 !p-0 focus-within:border-ink focus-within:shadow-[var(--focus-ring)]">
            <span className="max-w-[45%] shrink-0 truncate pl-2.5 font-mono text-[11.5px] text-muted">{prefix}</span>
            <input
              id="slug"
              value={form.slug}
              onChange={(e) => onSlugChange(normalizeSlugInput(e.target.value))}
              placeholder={fromTitle || "url-slug"}
              aria-invalid={Boolean(error)}
              className="min-w-0 flex-1 bg-transparent py-[7px] pr-2.5 font-mono text-[12px] outline-none"
            />
          </div>
          <button
            type="button"
            title="Generate from title"
            aria-label="Generate slug from title"
            disabled={!fromTitle || fromTitle === form.slug}
            onClick={() => onSlugFromTitle(fromTitle)}
            className="flex w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line text-muted hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </Field>

      <Field
        label="Excerpt"
        htmlFor="excerpt"
        error={errorExcerpt}
        count={{ current: form.excerpt.length, max: POST_LIMITS.excerpt }}
        hint="A one- or two-sentence summary, shown in lists."
      >
        <textarea
          id="excerpt"
          rows={4}
          value={form.excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          placeholder="A short summary."
          aria-invalid={Boolean(errorExcerpt)}
          className="input"
        />
      </Field>
    </Panel>
  );
}

// ── Details: the type's own fields, rendered from its definition ────────

function DetailsPanel({
  type,
  form,
  errors,
  problems,
  showPublishProblems,
  onChange,
}: {
  type: ContentTypeDefinition;
  form: EditorForm;
  errors: FormErrors;
  problems: PublishProblem[];
  showPublishProblems: boolean;
  onChange: (name: string, value: FormFieldValue | undefined) => void;
}) {
  return (
    <Panel title={`${type.displayName} details`} bodyClassName="flex flex-col gap-4">
      {type.fields.length === 0 ? (
        <p className="text-[12px] text-muted">{type.displayName} has no extra fields.</p>
      ) : (
        type.fields.map((field) => {
          const problem = showPublishProblems ? fieldPublishProblem(problems, field.name) : undefined;
          return (
            <FieldInput
              key={field.name}
              field={field}
              value={form.fields[field.name]}
              error={errors.fields[field.name] ?? (problem ? `${field.label} is required to publish.` : undefined)}
              onChange={(value) => onChange(field.name, value)}
            />
          );
        })
      )}
      {type.fields.some((field) => field.required) && <p className="text-[11px] text-muted">* Required to publish. Drafts can leave them empty.</p>}
    </Panel>
  );
}

/** One input for one field definition: the control follows `field.type`, nothing else is type-specific. */
export function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldDefinition;
  value: FormFieldValue | undefined;
  error?: string;
  onChange: (value: FormFieldValue | undefined) => void;
}) {
  const id = `field-${field.name}`;
  const text = typeof value === "string" ? value : "";

  if (field.type === "boolean") {
    return <Switch id={id} checked={value === true} onChange={onChange} label={field.label} />;
  }

  return (
    <Field
      label={field.label}
      htmlFor={id}
      required={field.required}
      error={error}
      count={field.type === "text" || field.type === "url" ? { current: text.length, max: POST_LIMITS.fieldText } : undefined}
      hint={field.type === "date" ? "Format: YYYY-MM-DD." : undefined}
    >
      {field.type === "select" ? (
        <Select
          id={id}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          options={[{ value: "", label: "Select…" }, ...field.options.map((option) => ({ value: option, label: option }))]}
        />
      ) : (
        <input
          id={id}
          className="input"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          {...INPUT_ATTRIBUTES[field.type]}
        />
      )}
    </Field>
  );
}

const INPUT_ATTRIBUTES: Record<Exclude<FieldDefinition["type"], "boolean" | "select">, React.InputHTMLAttributes<HTMLInputElement>> = {
  text: { type: "text" },
  url: { type: "url", inputMode: "url", placeholder: "https://" },
  date: { type: "date" },
  number: { type: "number", inputMode: "numeric", min: 0, step: 1 },
};
