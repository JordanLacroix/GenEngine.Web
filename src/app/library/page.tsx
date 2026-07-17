import type { Metadata } from "next";
import { LibraryContent } from "@/features/library/ui/library-content";

export const metadata: Metadata = { title: "Bibliothèque" };

export default function LibraryPage() {
  return <LibraryContent />;
}
