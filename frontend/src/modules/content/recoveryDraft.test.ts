// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { EditorForm } from "./form";
import {
  readRecoveryDraft,
  removeRecoveryDraft,
  writeRecoveryDraft,
} from "./recoveryDraft";

const sampleForm: EditorForm = {
  type: "news",
  title: "Local Title",
  slug: "local-title",
  excerpt: "Short summary",
  content: { type: "doc", content: [{ type: "paragraph" }] },
  fields: {},
};

describe("recoveryDraft", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no recovery draft exists", () => {
    expect(readRecoveryDraft("p1")).toBeNull();
  });

  it("writes and reads back a valid recovery draft", () => {
    writeRecoveryDraft("p1", sampleForm, 2);

    const draft = readRecoveryDraft("p1");
    expect(draft).not.toBeNull();
    expect(draft?.baseVersion).toBe(2);
    expect(draft?.form).toEqual(sampleForm);
    expect(typeof draft?.savedAt).toBe("number");
  });

  it("removes a recovery draft", () => {
    writeRecoveryDraft("p1", sampleForm, 1);
    removeRecoveryDraft("p1");
    expect(readRecoveryDraft("p1")).toBeNull();
  });

  it("filters out draft if expectedType does not match", () => {
    writeRecoveryDraft("new", sampleForm, null);
    expect(readRecoveryDraft("new", "career")).toBeNull();
    expect(readRecoveryDraft("new", "news")).not.toBeNull();
  });

  it("handles malformed JSON in storage safely", () => {
    localStorage.setItem("atomity:content-recovery:p1", "not json");
    expect(readRecoveryDraft("p1")).toBeNull();
    expect(localStorage.getItem("atomity:content-recovery:p1")).toBeNull();
  });

  it("cleans up invalid shape in storage", () => {
    localStorage.setItem(
      "atomity:content-recovery:p1",
      JSON.stringify({ formatVersion: 1, form: "invalid" }),
    );
    expect(readRecoveryDraft("p1")).toBeNull();
    expect(localStorage.getItem("atomity:content-recovery:p1")).toBeNull();
  });
});
