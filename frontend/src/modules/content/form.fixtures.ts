import type { ContentDoc } from "@/types/content";
import type { ContentTypeDefinition, Post } from "@/types/post";

/** The four types the backend serves today, as GET /content-types returns them. Test data only. */
export const NEWS: ContentTypeDefinition = {
  key: "news",
  displayName: "News",
  description: "Announcements and articles.",
  destination: { label: "Website", route: "/news" },
  fields: [],
};

export const CAREER: ContentTypeDefinition = {
  key: "career",
  displayName: "Career",
  description: "Job openings.",
  destination: { label: "Website", route: "/careers" },
  fields: [
    { name: "department", label: "Department", type: "text", required: true, options: [] },
    { name: "location", label: "Location", type: "text", required: true, options: [] },
    {
      name: "employmentType",
      label: "Employment type",
      type: "select",
      required: true,
      options: ["full-time", "part-time", "intern", "contract"],
    },
    { name: "applyUrl", label: "Apply URL", type: "url", required: true, options: [] },
    { name: "closingDate", label: "Closing date", type: "date", required: false, options: [] },
    { name: "remote", label: "Remote", type: "boolean", required: false, options: [] },
  ],
};

export const DOCS: ContentTypeDefinition = {
  key: "docs",
  displayName: "Docs",
  description: "Product documentation.",
  destination: { label: "Documentation", route: null },
  fields: [
    { name: "section", label: "Section", type: "text", required: true, options: [] },
    { name: "order", label: "Order", type: "number", required: false, options: [] },
  ],
};

export const KB: ContentTypeDefinition = {
  key: "kb",
  displayName: "Knowledge base",
  description: "Troubleshooting articles.",
  destination: { label: "Documentation", route: null },
  fields: [
    { name: "symptom", label: "Symptom", type: "text", required: true, options: [] },
    { name: "product", label: "Product", type: "text", required: false, options: [] },
    { name: "affectedVersions", label: "Affected versions", type: "text", required: false, options: [] },
  ],
};

export const TYPES = [NEWS, CAREER, DOCS, KB];

export function paragraph(text: string): ContentDoc {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

export function post(overrides: Partial<Post> = {}): Post {
  return {
    id: "p1",
    type: "news",
    title: "Hello",
    slug: "hello",
    excerpt: "",
    content: paragraph("Body"),
    fields: {},
    status: "DRAFT",
    version: 3,
    publishedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}
