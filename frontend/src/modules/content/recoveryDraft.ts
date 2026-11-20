import type { EditorForm } from "./form";

const PREFIX = "atomity:content-recovery:";
const FORMAT_VERSION = 1;

export interface RecoveryDraft {
  formatVersion: number;
  savedAt: number;
  baseVersion: number | null;
  form: EditorForm;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keyFor(contentId?: string): string {
  return `${PREFIX}${contentId ?? "new"}`;
}

export function readRecoveryDraft(contentId?: string, expectedType?: string): RecoveryDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyFor(contentId));
    if (!raw) return null;

    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || !isRecord(value.form)) {
      localStorage.removeItem(keyFor(contentId));
      return null;
    }
    const draft = value as unknown as RecoveryDraft;
    if (
      draft.formatVersion !== FORMAT_VERSION ||
      !Number.isFinite(draft.savedAt) ||
      !(draft.baseVersion === null || Number.isFinite(draft.baseVersion)) ||
      typeof draft.form.type !== "string" ||
      typeof draft.form.title !== "string" ||
      typeof draft.form.slug !== "string" ||
      typeof draft.form.excerpt !== "string" ||
      !isRecord(draft.form.content) ||
      !isRecord(draft.form.fields)
    ) {
      localStorage.removeItem(keyFor(contentId));
      return null;
    }

    if (expectedType && draft.form.type !== expectedType) {
      return null;
    }

    return draft;
  } catch {
    try {
      localStorage.removeItem(keyFor(contentId));
    } catch {
      // Storage can be disabled; recovery is best-effort.
    }
    return null;
  }
}

export function writeRecoveryDraft(
  contentId: string | undefined,
  form: EditorForm,
  baseVersion: number | null,
): void {
  try {
    const draft: RecoveryDraft = {
      formatVersion: FORMAT_VERSION,
      savedAt: Date.now(),
      baseVersion,
      form,
    };
    localStorage.setItem(keyFor(contentId), JSON.stringify(draft));
  } catch {
    // Storage can be disabled or full; editing continues normally.
  }
}

export function removeRecoveryDraft(contentId?: string): void {
  try {
    localStorage.removeItem(keyFor(contentId));
  } catch {
    // Storage can be disabled; recovery is best-effort.
  }
}
