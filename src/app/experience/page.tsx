import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PlayerExperienceHub } from "@/features/experience/ui/player-experience-hub";

export const metadata: Metadata = { title: "Mon univers" };

export default function ExperiencePage() {
  return <div className="page-shell inner-page experience-page">
    <header className="page-intro"><div><p className="eyebrow eyebrow--accent"><Sparkles size={15} /> Expérience personnelle</p><h1>Votre familier.<br /><em>Votre façon de jouer.</em></h1><p>Choisissez sa présence, son ton et son niveau d’aide. Retrouvez vos braises, vos récompenses et les objets qui rendent votre aventure unique.</p></div></header>
    <PlayerExperienceHub />
  </div>;
}
