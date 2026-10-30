import type { Metadata } from "next";
import { ContentListCanvas } from "@/modules/content/ContentListCanvas";

export const metadata: Metadata = { title: "Content · Atomity CMS" };

export default function ContentPage() {
  return <ContentListCanvas />;
}
