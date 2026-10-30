// Renders the small subset of Tiptap/ProseMirror JSON that the CMS editor produces to HTML.
// Every piece of text is escaped and only a few link schemes are kept, so content can never inject markup.

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Only http(s), mailto and site-relative links survive; "javascript:" and friends become "#". */
export function safeUrl(url) {
  const value = String(url ?? "").trim();
  if (/^(https?:|mailto:)/i.test(value) || (value.startsWith("/") && !value.startsWith("//"))) return value;
  return "#";
}

/**
 * @param {object} node a Tiptap node
 * @param {{cmsUrl?: string}} options cmsUrl is prefixed to site-relative image URLs such as /api/v1/media/<id>/file
 */
export function renderNode(node, options = {}) {
  if (!node || typeof node !== "object") return "";
  const children = () => (node.content ?? []).map((child) => renderNode(child, options)).join("");
  switch (node.type) {
    case "doc":
      return children();
    case "paragraph":
      return `<p>${children()}</p>`;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 2));
      return `<h${level}>${children()}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${children()}</ul>`;
    case "orderedList":
      return `<ol>${children()}</ol>`;
    case "listItem":
      return `<li>${children()}</li>`;
    case "blockquote":
      return `<blockquote>${children()}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${children()}</code></pre>`;
    case "horizontalRule":
      return "<hr>";
    case "hardBreak":
      return "<br>";
    case "image": {
      const src = safeUrl(node.attrs?.src);
      const absolute = src.startsWith("/") && options.cmsUrl ? options.cmsUrl.replace(/\/$/, "") + src : src;
      return `<img src="${esc(absolute)}" alt="${esc(node.attrs?.alt ?? "")}" style="max-width:100%">`;
    }
    case "text":
      return renderMarks(esc(node.text), node.marks ?? []);
    default:
      // A node type this example doesn't know: keep its text, drop the wrapper.
      return children();
  }
}

function renderMarks(html, marks) {
  return marks.reduce((inner, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong>${inner}</strong>`;
      case "italic":
        return `<em>${inner}</em>`;
      case "strike":
        return `<s>${inner}</s>`;
      case "code":
        return `<code>${inner}</code>`;
      case "link":
        return `<a href="${esc(safeUrl(mark.attrs?.href))}" rel="noopener noreferrer">${inner}</a>`;
      default:
        return inner;
    }
  }, html);
}
