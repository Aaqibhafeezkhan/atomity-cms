/**
 * The post body is stored as Tiptap (ProseMirror) JSON, not HTML. This is the
 * minimal shape of that document — enough to walk it for word counts and to find
 * the images a post references. Tiptap's own `JSONContent` is structurally the same.
 */
export interface ContentNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

export interface ContentDoc extends ContentNode {
  type: "doc";
}
