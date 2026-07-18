import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PlayerExperienceHub } from "@/features/experience/ui/player-experience-hub";

export const metadata: Metadata = { title: "Votre aventure" };

export default function ExperiencePage() {
  return <div className="page-shell inner-page experience-page">
    <header className="page-intro"><div><p className="eyebrow eyebrow--accent"><Sparkles size={15} /> Votre aventure</p><h1>Un monde.<br /><em>Tous vos chemins.</em></h1><p>Explorez la carte, retrouvez ce que vous avez accompli et choisissez la présence qui vous accompagne.</p></div></header>
    <PlayerExperienceHub />
  </div>;
}
