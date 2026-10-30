import assert from "node:assert/strict";
import { test } from "node:test";
import { esc, renderNode, safeUrl } from "./render.mjs";

const doc = (...content) => ({ type: "doc", content });
const p = (...content) => ({ type: "paragraph", content });
const text = (value, marks) => ({ type: "text", text: value, ...(marks ? { marks } : {}) });

test("renders paragraphs, headings and lists", () => {
  const html = renderNode(doc(
    { type: "heading", attrs: { level: 2 }, content: [text("Title")] },
    p(text("Hello "), text("world", [{ type: "bold" }])),
    { type: "bulletList", content: [{ type: "listItem", content: [p(text("one"))] }] },
  ));
  assert.equal(html, "<h2>Title</h2><p>Hello <strong>world</strong></p><ul><li><p>one</p></li></ul>");
});

test("renders marks, code blocks and links", () => {
  assert.equal(renderNode(p(text("a", [{ type: "italic" }, { type: "bold" }]))), "<p><strong><em>a</em></strong></p>");
  assert.equal(renderNode({ type: "codeBlock", content: [text("x < y")] }), "<pre><code>x &lt; y</code></pre>");
  assert.equal(
    renderNode(p(text("site", [{ type: "link", attrs: { href: "https://atomity.de" } }]))),
    '<p><a href="https://atomity.de" rel="noopener noreferrer">site</a></p>',
  );
});

test("escapes text so content cannot inject markup", () => {
  const html = renderNode(p(text('<script>alert("x")</script>')));
  assert.equal(html, "<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>");
  assert.equal(esc(`a&b'c`), "a&amp;b&#39;c");
});

test("dangerous link schemes are neutralised", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "#");
  assert.equal(safeUrl("data:text/html,x"), "#");
  assert.equal(safeUrl("//evil.example"), "#");
  assert.equal(safeUrl("/docs/x"), "/docs/x");
  assert.equal(safeUrl("mailto:jobs@example.org"), "mailto:jobs@example.org");
  assert.match(renderNode(p(text("x", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]))), /href="#"/);
});

test("images use the CMS address for site-relative URLs", () => {
  const image = { type: "image", attrs: { src: "/api/v1/media/abc/file", alt: 'a "pic"' } };
  assert.equal(
    renderNode(image, { cmsUrl: "http://localhost:8080/" }),
    '<img src="http://localhost:8080/api/v1/media/abc/file" alt="a &quot;pic&quot;" style="max-width:100%">',
  );
});

test("unknown nodes keep their text and bad input renders nothing", () => {
  assert.equal(renderNode({ type: "futureWidget", content: [p(text("kept"))] }), "<p>kept</p>");
  assert.equal(renderNode(null), "");
  assert.equal(renderNode("nope"), "");
});
