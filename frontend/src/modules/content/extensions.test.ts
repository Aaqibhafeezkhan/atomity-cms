import { getSchema } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { collectImageIds } from "@/lib/content";
import type { ContentDoc } from "@/types/content";
import { editorExtensions } from "./extensions";

const schema = getSchema(editorExtensions);

describe("the editor's schema", () => {
  it("keeps headings to levels 2 and 3", () => {
    const heading = schema.nodes.heading;
    expect(() => heading.create({ level: 2 })).not.toThrow();
    expect(heading.spec.attrs?.level).toBeDefined();
  });

  it("lets an image carry the id of the media item it came from", () => {
    const doc: ContentDoc = {
      type: "doc",
      content: [{ type: "image", attrs: { src: "/api/v1/media/m1/file", alt: "A", mediaId: "m1" } }],
    };
    const node = schema.nodeFromJSON(doc);
    node.check();
    expect(node.firstChild?.attrs.mediaId).toBe("m1");
    expect(collectImageIds(node.toJSON() as ContentDoc)).toEqual(["m1"]);
  });
});
