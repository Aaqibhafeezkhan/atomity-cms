import type { Metadata } from "next";
import { ContentEditorCanvas } from "@/modules/content/ContentEditorCanvas";

export const metadata: Metadata = { title: "New content · Atomity CMS" };

export default async function NewContentPage(props: PageProps<"/content/new">) {
  const { type } = await props.searchParams;
  // `?type=` is a single key; a repeated parameter (an array) is ignored and the editor falls back to its default.
  return <ContentEditorCanvas initialType={typeof type === "string" ? type : undefined} />;
}
