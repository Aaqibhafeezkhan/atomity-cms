// A minimal "website" that renders published Atomity CMS content. Server-side fetching only, so the
// CMS needs no CORS configuration. This is an example, not Atomity's production website: the CMS
// decides nothing about how these pages look or which URLs they live at.
import { createServer } from "node:http";
import { esc, renderNode } from "./render.mjs";

const CMS_API_URL = (process.env.CMS_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
const PORT = Number(process.env.PORT ?? 4000);

// This consumer picks its own routes. The CMS exposes a "destination" per type as a hint, but docs and kb
// have no route yet, and nothing here depends on it.
const ROUTES = { news: "/news", career: "/careers", docs: "/docs", kb: "/kb" };
const TITLES = { news: "News", career: "Careers", docs: "Documentation", kb: "Knowledge base" };

async function cms(path) {
  const response = await fetch(`${CMS_API_URL}/api/v1${path}`, { headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

const STYLE = `body{font:16px/1.55 system-ui,sans-serif;max-width:46rem;margin:0 auto;padding:1.5rem;color:#1b1f24}
nav a{margin-right:1rem}pre{background:#f3f4f6;padding:.75rem;overflow:auto}blockquote{border-left:3px solid #ccc;margin-left:0;padding-left:1rem;color:#555}
.meta{color:#666;font-size:.9rem}.card{border-bottom:1px solid #e5e7eb;padding:.75rem 0}dl{display:grid;grid-template-columns:max-content 1fr;gap:.2rem 1rem}dt{color:#666}`;

function layout(title, body, status = 200) {
  const nav = Object.entries(ROUTES).map(([key, route]) => `<a href="${route}">${esc(TITLES[key])}</a>`).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)} · Mock consumer</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLE}</style></head>
<body><header><strong>Mock consumer</strong> <span class="meta">(example site reading ${esc(CMS_API_URL)})</span><nav>${nav}</nav></header><main>${body}</main></body></html>`;
  return { status, html };
}

function fieldList(fields) {
  const entries = Object.entries(fields ?? {});
  if (entries.length === 0) return "";
  return `<dl>${entries.map(([name, value]) => `<dt>${esc(name)}</dt><dd>${esc(value)}</dd>`).join("")}</dl>`;
}

async function listPage(type) {
  const { status, body } = await cms(`/content/${type}?size=50`);
  if (status !== 200) return layout("Error", `<p>The CMS answered ${esc(status)}.</p>`, 502);
  const items = body.data ?? [];
  const cards = items.map((item) => `<div class="card"><h3><a href="${ROUTES[type]}/${encodeURIComponent(item.slug)}">${esc(item.title)}</a></h3>
<p>${esc(item.excerpt)}</p>${fieldList(item.fields)}<p class="meta">Published ${esc(item.publishedAt)}</p></div>`).join("");
  return layout(TITLES[type], `<h1>${esc(TITLES[type])}</h1>${cards || "<p>Nothing published yet.</p>"}`);
}

async function detailPage(type, slug) {
  const { status, body } = await cms(`/content/${type}/slug/${encodeURIComponent(slug)}`);
  if (status === 404) return layout("Not found", `<h1>Not found</h1><p>No published ${esc(type)} item "${esc(slug)}".</p>`, 404);
  if (status !== 200) return layout("Error", `<p>The CMS answered ${esc(status)}.</p>`, 502);
  const item = body.data;
  return layout(item.title, `<h1>${esc(item.title)}</h1><p class="meta">${esc(TITLES[type])} · published ${esc(item.publishedAt)}</p>
${fieldList(item.fields)}${renderNode(item.content, { cmsUrl: CMS_API_URL })}`);
}

async function indexPage() {
  const rows = await Promise.all(Object.keys(ROUTES).map(async (type) => {
    const { status, body } = await cms(`/content/${type}?size=1`);
    const count = status === 200 ? body.meta?.totalElements ?? 0 : "?";
    return `<li><a href="${ROUTES[type]}">${esc(TITLES[type])}</a> <span class="meta">(${esc(count)} published)</span></li>`;
  }));
  return layout("Home", `<h1>Atomity CMS mock consumer</h1><p>Everything below was fetched from the CMS public API.</p><ul>${rows.join("")}</ul>`);
}

const typeByRoute = Object.fromEntries(Object.entries(ROUTES).map(([type, route]) => [route.slice(1), type]));

export async function handle(pathname) {
  if (pathname === "/healthz") return { status: 200, html: "ok" };
  if (pathname === "/") return indexPage();
  const [section, slug, extra] = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const type = typeByRoute[section];
  if (type && !slug) return listPage(type);
  if (type && slug && !extra) return detailPage(type, slug);
  return layout("Not found", "<h1>Not found</h1>", 404);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer(async (req, res) => {
    let result;
    try {
      result = await handle(new URL(req.url, "http://localhost").pathname);
    } catch {
      result = layout("CMS unreachable", `<h1>CMS unreachable</h1><p>Could not reach ${esc(CMS_API_URL)}. Is the stack running?</p>`, 502);
    }
    res.writeHead(result.status, { "Content-Type": "text/html; charset=utf-8", "X-Content-Type-Options": "nosniff" });
    res.end(result.html);
  }).listen(PORT, () => console.log(`Mock consumer on http://localhost:${PORT}, reading ${CMS_API_URL}`));
}
