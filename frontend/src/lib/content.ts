import type { ContentDoc, ContentNode } from "@/types/content";

/** Average adult silent-reading speed used for the "N min read" estimate. */
const WORDS_PER_MINUTE = 200;

export const EMPTY_DOC: ContentDoc = { type: "doc", content: [{ type: "paragraph" }] };

/** Block-level nodes whose text should be separated by a space when flattened. */
const BLOCK_TYPES = new Set(["paragraph", "heading", "blockquote", "listItem", "codeBlock", "bulletList", "orderedList"]);

/** Plain text of a document — what search and word counts run on. */
export function extractText(node: ContentNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";
  const inner = (node.content ?? []).map(extractText).join("");
  return BLOCK_TYPES.has(node.type) ? `${inner} ` : inner;
}

export function countWords(doc: ContentNode): number {
  const text = extractText(doc).trim();
  return text ? text.split(/\s+/).length : 0;
}

export function readingTimeMinutes(wordCount: number): number {
  return wordCount === 0 ? 0 : Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}

export function isDocEmpty(doc: ContentNode): boolean {
  return countWords(doc) === 0 && collectImageIds(doc).length === 0;
}

/** Media ids of every image embedded in the body (kept on each image node as `attrs.mediaId`). */
export function collectImageIds(node: ContentNode, into: string[] = []): string[] {
  if (node.type === "image" && typeof node.attrs?.mediaId === "string") into.push(node.attrs.mediaId);
  node.content?.forEach((child) => collectImageIds(child, into));
  return into;
}
