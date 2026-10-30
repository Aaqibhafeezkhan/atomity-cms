// Demonstrates the whole flow against a running CMS and fails loudly if any step misbehaves, so it also
// works as an end-to-end check:
//   create a draft -> prove it is NOT public -> try to publish an incomplete item (rejected)
//   -> publish -> fetch it through the public API -> (the mock consumer then displays it).
// Safe to run repeatedly: items use fixed slugs and are reused when they already exist.
const CMS_API_URL = (process.env.CMS_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin"; // the documented local default

const text = (value, marks) => ({ type: "text", text: value, ...(marks ? { marks } : {}) });
const p = (...content) => ({ type: "paragraph", content });
const doc = (...content) => ({ type: "doc", content });
const list = (...items) => ({ type: "bulletList", content: items.map((item) => ({ type: "listItem", content: [p(text(item))] })) });

const ITEMS = [
  {
    type: "news", title: "Demo: Atomity opens its CMS", excerpt: "A first look at the open-source content platform.",
    content: doc({ type: "heading", attrs: { level: 2 }, content: [text("Hello, world")] },
      p(text("This is a "), text("news", [{ type: "bold" }]), text(" item served by the public API.")), list("Write", "Validate", "Publish")),
    fields: {},
  },
  {
    type: "career", title: "Demo: Java Backend Intern", excerpt: "Help build the content API.",
    content: doc(p(text("You will work on a Spring Boot API with PostgreSQL.")), list("Java 21", "Spring Boot", "Testcontainers")),
    fields: { department: "Engineering", location: "Mannheim", employmentType: "intern", applyUrl: "https://example.org/apply", closingDate: "2030-12-31", remote: true },
  },
  {
    type: "docs", title: "Demo: Connect your first cloud account", excerpt: "Step-by-step onboarding.",
    content: doc({ type: "heading", attrs: { level: 2 }, content: [text("Prerequisites")] }, list("A cloud account", "Read access"),
      { type: "codeBlock", content: [text("atomity connect --provider aws")] }),
    fields: { section: "Getting started", order: 1 },
  },
  {
    type: "kb", title: "Demo: Onboarding fails with a 403", excerpt: "Why the connection is refused and how to fix it.",
    content: doc(p(text("The role is missing the "), text("ReadOnlyAccess", [{ type: "code" }]), text(" policy. Attach it and retry.")),
      { type: "blockquote", content: [p(text("Tip: wait a minute for permissions to propagate."))] }),
    fields: { symptom: "HTTP 403 while connecting a cloud account", product: "Atomity Agent", affectedVersions: "1.0 - 1.4" },
  },
];

let token = "";
async function call(method, path, body, { auth = true } = {}) {
  const response = await fetch(`${CMS_API_URL}/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

let failures = 0;
function check(label, condition, detail = "") {
  console.log(`  ${condition ? "ok  " : "FAIL"} ${label}${condition ? "" : ` ${detail}`}`);
  if (!condition) failures++;
}
const slugOf = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function ensure(type, payload) {
  const created = await call("POST", "/posts", { ...payload, type });
  if (created.status === 201) return created.body.data;
  if (created.status === 409) {
    const found = await call("GET", `/posts?type=${type}&q=${encodeURIComponent(slugOf(payload.title))}`);
    const match = (found.body?.data ?? []).find((item) => item.slug === slugOf(payload.title));
    if (match) return (await call("GET", `/posts/${match.id}`)).body.data;
  }
  throw new Error(`Could not create ${type}: HTTP ${created.status} ${JSON.stringify(created.body)}`);
}

const login = await call("POST", "/auth/login", { email: EMAIL, password: PASSWORD }, { auth: false });
if (login.status !== 200) {
  console.error(`Login failed (HTTP ${login.status}). Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD if you changed the admin account.`);
  process.exit(1);
}
token = login.body.data.token;

for (const item of ITEMS) {
  console.log(`\n[${item.type}] ${item.title}`);
  const draft = await ensure(item.type, item);
  const slug = draft.slug;
  if (draft.status === "DRAFT") {
    const hidden = await call("GET", `/content/${item.type}/slug/${slug}`, undefined, { auth: false });
    check("a draft is not available publicly (404)", hidden.status === 404, `got ${hidden.status}`);
    const published = await call("POST", `/posts/${draft.id}/publish`);
    check("publish succeeds", published.status === 200, `got ${published.status} ${JSON.stringify(published.body?.errors)}`);
  } else {
    console.log(`  (already ${draft.status.toLowerCase()} from an earlier run)`);
  }
  const shown = await call("GET", `/content/${item.type}/slug/${slug}`, undefined, { auth: false });
  check("the public API returns it by slug", shown.status === 200 && shown.body?.data?.title === item.title, `got ${shown.status}`);
  const listed = await call("GET", `/content/${item.type}`, undefined, { auth: false });
  check("it appears in the public list for its type", (listed.body?.data ?? []).some((entry) => entry.slug === slug));
  const leaked = (listed.body?.data ?? []).filter((entry) => entry.type !== item.type);
  check("the list holds only its own type", leaked.length === 0);
}

console.log("\n[validation] an incomplete career cannot be published");
const incomplete = await ensure("career", { title: "Demo: Incomplete career", excerpt: "", content: doc(p(text("Draft."))), fields: { location: "Berlin" } });
const refused = await call("POST", `/posts/${incomplete.id}/publish`);
check("publish is refused with 422 NOT_PUBLISHABLE", refused.status === 422 && refused.body?.errors?.[0]?.errorCode === "NOT_PUBLISHABLE", `got ${refused.status}`);
console.log(`  server says: ${refused.body?.errors?.[0]?.message}`);
const hiddenIncomplete = await call("GET", `/content/career/slug/${incomplete.slug}`, undefined, { auth: false });
check("and it stays invisible to the public", hiddenIncomplete.status === 404);

console.log(failures === 0 ? "\nAll checks passed. Open the mock consumer (default http://localhost:4000) to see the published items." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
