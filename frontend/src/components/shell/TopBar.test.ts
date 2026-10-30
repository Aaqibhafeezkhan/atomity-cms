import { describe, expect, it } from "vitest";
import { resolveBreadcrumb } from "./TopBar";

describe("resolveBreadcrumb", () => {
  it("names the content list and media sections", () => {
    expect(resolveBreadcrumb("/content")).toEqual([{ label: "Content", href: "/content" }]);
    expect(resolveBreadcrumb("/media")).toEqual([{ label: "Media", href: "/media" }]);
  });

  it("adds a crumb for creating and editing content", () => {
    expect(resolveBreadcrumb("/content/new")).toEqual([{ label: "Content", href: "/content" }, { label: "New content" }]);
    expect(resolveBreadcrumb("/content/abc-123")).toEqual([{ label: "Content", href: "/content" }, { label: "Edit content" }]);
  });
});
