import type { Metadata } from "next";
import { PlayerExperienceHub } from "@/features/experience/ui/player-experience-hub";

export const metadata: Metadata = { title: "Votre aventure" };

export default function ExperiencePage() {
  return <PlayerExperienceHub />;
}
