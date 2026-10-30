import { describe, expect, it } from "vitest";
import { EMPTY_DOC } from "@/lib/content";
import type { ContentDoc } from "@/types/content";
import { CAREER, DOCS, KB, NEWS, TYPES, paragraph, post } from "./form.fixtures";
import {
  changeType,
  describeDestination,
  describePublishProblems,
  emptyForm,
  fieldPublishProblem,
  findType,
  formAfterSave,
  formFromPost,
  hasErrors,
  isDirty,
  joinMissing,
  newForm,
  publishProblems,
  setField,
  slugFollowsTitle,
  snapshotOf,
  toRequest,
  typeLabel,
  validateForm,
  withTitle,
  type EditorForm,
} from "./form";

function filled(overrides: Partial<EditorForm> = {}): EditorForm {
  return { ...emptyForm("news"), title: "Hello", slug: "hello", content: paragraph("Body"), ...overrides };
}

const completeCareer: EditorForm = filled({
  type: "career",
  fields: {
    department: "Engineering",
    location: "Berlin",
    employmentType: "full-time",
    applyUrl: "https://example.com/apply",
  },
});

describe("choosing a type", () => {
  it("finds a type by key and labels it, falling back to the key", () => {
    expect(findType(TYPES, "career")).toBe(CAREER);
    expect(findType(TYPES, "nope")).toBeUndefined();
    expect(typeLabel(TYPES, "kb")).toBe("Knowledge base");
    expect(typeLabel(undefined, "kb")).toBe("kb");
  });

  it("describes where a type is destined, saying so when the route is undecided", () => {
    expect(describeDestination(NEWS)).toBe("Website · /news");
    expect(describeDestination(DOCS)).toBe("Documentation · route to be decided");
  });

  it("starts a new item blank for the chosen type", () => {
    expect(newForm(KB)).toEqual({ type: "kb", title: "", slug: "", excerpt: "", content: EMPTY_DOC, fields: {} });
  });

  it("keeps same-named, same-kind values when the type changes and drops the rest", () => {
    const form = filled({ type: "career", fields: { department: "Eng", remote: true, section: "Intro" } });
    const toDocs = changeType(form, DOCS);
    expect(toDocs.type).toBe("docs");
    expect(toDocs.fields).toEqual({ section: "Intro" });
    expect(changeType(form, NEWS).fields).toEqual({});
    expect(changeType(form, CAREER).fields).toEqual({ department: "Eng", remote: true });
  });

  it("drops a value whose kind doesn't fit the new field", () => {
    expect(changeType(filled({ fields: { remote: "yes" } }), CAREER).fields).toEqual({});
  });
});

describe("formFromPost", () => {
  it("loads each field into the shape its input edits", () => {
    const form = formFromPost(
      post({ type: "career", fields: { department: "Eng", remote: false, closingDate: "2026-12-31" } }),
      CAREER,
    );
    expect(form.fields).toEqual({ department: "Eng", remote: false, closingDate: "2026-12-31" });
  });

  it("turns numbers into digit strings", () => {
    expect(formFromPost(post({ type: "docs", fields: { section: "Intro", order: 0 } }), DOCS).fields).toEqual({
      section: "Intro",
      order: "0",
    });
  });

  it("ignores stored values the type doesn't define", () => {
    expect(formFromPost(post({ type: "news", fields: { stray: "x" } }), NEWS).fields).toEqual({});
  });
});

describe("toRequest", () => {
  it("builds a create body with the type and no version or empty slug", () => {
    const body = toRequest(filled({ slug: "" }), NEWS);
    expect(body).toEqual({ type: "news", title: "Hello", excerpt: "", content: paragraph("Body"), fields: {} });
    expect("version" in body).toBe(false);
    expect("slug" in body).toBe(false);
  });

  it("builds an update body with the version and without the type", () => {
    const body = toRequest(filled(), NEWS, 7);
    expect(body.version).toBe(7);
    expect("type" in body).toBe(false);
    expect(body.slug).toBe("hello");
  });

  it("omits empty and whitespace-only field values and trims the rest", () => {
    const form = filled({ type: "career", fields: { department: "  Eng  ", location: "", applyUrl: "   " } });
    expect(toRequest(form, CAREER).fields).toEqual({ department: "Eng" });
  });

  it("sends number fields as integers, and none when empty", () => {
    expect(toRequest(filled({ type: "docs", fields: { section: "Intro", order: "12" } }), DOCS).fields).toEqual({
      section: "Intro",
      order: 12,
    });
    expect(toRequest(filled({ type: "docs", fields: { order: "0" } }), DOCS).fields).toEqual({ order: 0 });
    expect(toRequest(filled({ type: "docs", fields: { order: "" } }), DOCS).fields).toEqual({});
  });

  it("sends booleans only when they were set, including false", () => {
    expect(toRequest(filled({ type: "career" }), CAREER).fields).toEqual({});
    expect(toRequest(filled({ type: "career", fields: { remote: true } }), CAREER).fields).toEqual({ remote: true });
    expect(toRequest(filled({ type: "career", fields: { remote: false } }), CAREER).fields).toEqual({ remote: false });
  });

  it("sends only the fields of the item's type", () => {
    const form = filled({ type: "kb", fields: { symptom: "Crash", department: "stale" } });
    expect(toRequest(form, KB).fields).toEqual({ symptom: "Crash" });
  });
});

describe("validateForm", () => {
  it("accepts an empty draft of every type", () => {
    for (const type of TYPES) expect(hasErrors(validateForm(emptyForm(type.key), type))).toBe(false);
  });

  it("rejects a malformed slug and over-long title and excerpt", () => {
    const errors = validateForm(filled({ slug: "Not A Slug", title: "x".repeat(201), excerpt: "y".repeat(301) }), NEWS);
    expect(errors.slug).toBeDefined();
    expect(errors.title).toBeDefined();
    expect(errors.excerpt).toBeDefined();
  });

  it("checks the format of filled fields only", () => {
    const bad = filled({
      type: "career",
      fields: { applyUrl: "ftp://x.test", closingDate: "2026-02-30", employmentType: "freelance", department: "x".repeat(501) },
    });
    const errors = validateForm(bad, CAREER).fields;
    expect(Object.keys(errors).sort()).toEqual(["applyUrl", "closingDate", "department", "employmentType"]);
    expect(hasErrors(validateForm(completeCareer, CAREER))).toBe(false);
  });

  it("wants number fields to be whole, non-negative numbers", () => {
    for (const value of ["1.5", "-1", "abc", "1000001"]) {
      expect(validateForm(filled({ type: "docs", fields: { order: value } }), DOCS).fields.order).toBeDefined();
    }
    expect(validateForm(filled({ type: "docs", fields: { order: "1000000" } }), DOCS).fields.order).toBeUndefined();
  });
});

describe("publishProblems", () => {
  it("news needs only a title and content", () => {
    expect(publishProblems(filled(), NEWS)).toEqual([]);
    expect(publishProblems(filled({ title: "  " }), NEWS).map((p) => p.target)).toEqual(["title"]);
    expect(publishProblems(filled({ content: EMPTY_DOC }), NEWS).map((p) => p.target)).toEqual(["content"]);
  });

  it("an image alone counts as content", () => {
    const image: ContentDoc = { type: "doc", content: [{ type: "image", attrs: { src: "/m", mediaId: "m1" } }] };
    expect(publishProblems(filled({ content: image }), NEWS)).toEqual([]);
  });

  it("career needs department, location, employment type and apply URL", () => {
    const problems = publishProblems(filled({ type: "career" }), CAREER);
    expect(problems.map((p) => p.missing)).toEqual([
      "the Department field",
      "the Location field",
      "the Employment type field",
      "the Apply URL field",
    ]);
    expect(publishProblems(completeCareer, CAREER)).toEqual([]);
  });

  it("career's optional fields never block", () => {
    expect(publishProblems({ ...completeCareer, fields: { ...completeCareer.fields, remote: false } }, CAREER)).toEqual([]);
  });

  it("docs needs a section but not an order", () => {
    expect(publishProblems(filled({ type: "docs" }), DOCS).map((p) => p.missing)).toEqual(["the Section field"]);
    expect(publishProblems(filled({ type: "docs", fields: { section: "Intro" } }), DOCS)).toEqual([]);
  });

  it("kb needs a symptom but not product or versions", () => {
    expect(publishProblems(filled({ type: "kb" }), KB).map((p) => p.missing)).toEqual(["the Symptom field"]);
    expect(publishProblems(filled({ type: "kb", fields: { symptom: "Crash on start" } }), KB)).toEqual([]);
  });

  it("blank text doesn't count as filled", () => {
    expect(publishProblems(filled({ type: "kb", fields: { symptom: "   " } }), KB)).toHaveLength(1);
  });

  it("words the problems like the backend's 422", () => {
    const problems = publishProblems(filled({ type: "career", title: "", fields: { ...completeCareer.fields, department: "" } }), CAREER);
    expect(describePublishProblems(problems)).toBe("Add a title and the Department field before publishing.");
    expect(describePublishProblems(publishProblems(emptyForm("news"), NEWS))).toBe(
      "Add a title and some content before publishing.",
    );
  });

  it("finds the problem belonging to one field", () => {
    const problems = publishProblems(filled({ type: "docs" }), DOCS);
    expect(fieldPublishProblem(problems, "section")?.missing).toBe("the Section field");
    expect(fieldPublishProblem(problems, "order")).toBeUndefined();
  });

  it("joins lists of one, two and three", () => {
    expect(joinMissing(["a title"])).toBe("a title");
    expect(joinMissing(["a title", "some content"])).toBe("a title and some content");
    expect(joinMissing(["a", "b", "c"])).toBe("a, b and c");
  });
});

describe("isDirty", () => {
  const saved = filled({ type: "docs", fields: { section: "Intro" } });

  it("is false for an untouched form", () => {
    expect(isDirty(saved, saved)).toBe(false);
    expect(isDirty(saved, snapshotOf(saved))).toBe(false);
  });

  it("sees changes to the title, slug, excerpt, content and fields", () => {
    expect(isDirty({ ...saved, title: "Other" }, saved)).toBe(true);
    expect(isDirty({ ...saved, slug: "other" }, saved)).toBe(true);
    expect(isDirty({ ...saved, excerpt: "More" }, saved)).toBe(true);
    expect(isDirty({ ...saved, content: paragraph("Edited") }, saved)).toBe(true);
    expect(isDirty(setField(saved, "section", "Other"), saved)).toBe(true);
    expect(isDirty(setField(saved, "order", "2"), saved)).toBe(true);
  });

  it("treats a field typed into and cleared again as unchanged", () => {
    expect(isDirty(setField(saved, "order", ""), saved)).toBe(false);
  });

  it("treats a toggled boolean as changed", () => {
    const career = filled({ type: "career" });
    expect(isDirty(setField(career, "remote", false), career)).toBe(true);
    expect(isDirty(setField(career, "remote", undefined), career)).toBe(false);
  });

  it("treats the same body with its keys in another order as unchanged", () => {
    // Postgres JSONB sorts keys, so a loaded item has { text, type } where Tiptap emits { type, text }.
    const fromApi: ContentDoc = { type: "doc", content: [{ content: [{ text: "Body", type: "text" }], type: "paragraph" }] };
    expect(isDirty({ ...saved, content: fromApi }, saved)).toBe(false);
  });

  it("still sees paragraphs in a different order", () => {
    const one = { type: "paragraph", content: [{ type: "text", text: "One" }] };
    const two = { type: "paragraph", content: [{ type: "text", text: "Two" }] };
    const a = { ...saved, content: { type: "doc", content: [one, two] } satisfies ContentDoc };
    const b = { ...saved, content: { type: "doc", content: [two, one] } satisfies ContentDoc };
    expect(isDirty(a, b)).toBe(true);
  });
});

describe("slug handling", () => {
  it("follows the title for a new item", () => {
    expect(slugFollowsTitle(null)).toBe(true);
    const form = withTitle(emptyForm("news"), "Hello, World!", true);
    expect(form.slug).toBe("hello-world");
    expect(withTitle(form, "Hello Again", true).slug).toBe("hello-again");
  });

  it("stops following once it is edited by hand", () => {
    const form = { ...emptyForm("news"), slug: "custom" };
    expect(withTitle(form, "Something else", false)).toMatchObject({ title: "Something else", slug: "custom" });
  });

  it("keeps following on a draft whose slug came from its title, but not otherwise", () => {
    expect(slugFollowsTitle({ status: "DRAFT", title: "Hello World", slug: "hello-world" })).toBe(true);
    expect(slugFollowsTitle({ status: "DRAFT", title: "Hello World", slug: "custom" })).toBe(false);
    expect(slugFollowsTitle({ status: "PUBLISHED", title: "Hello World", slug: "hello-world" })).toBe(false);
    expect(slugFollowsTitle({ status: "DRAFT", title: "", slug: "draft-abc1" })).toBe(false);
  });
});

describe("formAfterSave", () => {
  const sent = filled();

  it("matches what was saved when nothing changed during the save", () => {
    expect(isDirty(formAfterSave(sent, sent, "hello"), sent)).toBe(false);
  });

  it("keeps edits made while the save was in flight", () => {
    const current = { ...sent, title: "Hello again", content: paragraph("More typed while saving") };
    expect(formAfterSave(current, sent, "hello")).toEqual(current);
  });

  it("takes the slug the server filled in for an empty one", () => {
    const untitled = { ...sent, slug: "" };
    expect(formAfterSave(untitled, untitled, "draft-abc123").slug).toBe("draft-abc123");
  });

  it("keeps a slug that changed on screen during the save", () => {
    expect(formAfterSave({ ...sent, slug: "hello-world" }, sent, "hello").slug).toBe("hello-world");
  });
});
