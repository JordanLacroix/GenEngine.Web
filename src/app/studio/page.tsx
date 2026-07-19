import type { Metadata } from "next";
import { StudioShell } from "@/features/studio/ui/studio-shell";

export const metadata: Metadata = { title: "Studio" };

/** Plein écran à HUD : la barre latérale porte la navigation, le reste est l'atelier. */
export default function StudioPage() {
  return <StudioShell />;
}
