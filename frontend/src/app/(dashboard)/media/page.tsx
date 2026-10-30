import type { Metadata } from "next";
import { MediaLibraryCanvas } from "@/modules/media/MediaLibraryCanvas";

export const metadata: Metadata = { title: "Media · Atomity CMS" };

export default function MediaPage() {
  return <MediaLibraryCanvas />;
}
