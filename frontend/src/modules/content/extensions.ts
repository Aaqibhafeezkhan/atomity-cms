import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";

/**
 * Image node that also remembers which media-library item it came from
 * (`attrs.mediaId`), so the backend can tell which images an item uses — e.g. to
 * stop one being deleted from the library while it's still in use.
 */
const ContentImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-media-id"),
        renderHTML: (attributes) => (attributes.mediaId ? { "data-media-id": attributes.mediaId } : {}),
      },
    };
  },
});

/** The content editor's extensions; shared with the tests so they check the same schema the editor uses. */
export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
  }),
  ContentImage,
  Placeholder.configure({ placeholder: "Start writing…" }),
];
