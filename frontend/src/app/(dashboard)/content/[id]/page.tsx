import type { Metadata } from "next";
import { ContentEditorCanvas } from "@/modules/content/ContentEditorCanvas";

export const metadata: Metadata = { title: "Edit content · Atomity CMS" };

export default async function EditContentPage(props: PageProps<"/content/[id]">) {
  const { id } = await props.params;
  return <ContentEditorCanvas contentId={id} />;
}
