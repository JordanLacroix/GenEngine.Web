import type { Metadata } from "next";
import { Feather } from "lucide-react";
import { StudioShell } from "@/features/studio/ui/studio-shell";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return (
    <div className="page-shell inner-page studio-page">
      <header className="page-intro studio-intro">
        <div>
          <p className="eyebrow eyebrow--accent"><Feather size={15} aria-hidden="true" /> Configuration du jeu</p>
          <h1>Configurez votre monde,<br /><em>puis écoutez-le.</em></h1>
          <p>Le jeu, ses catégories, son familier, son vocabulaire, ses médias et ses scénarios — chaque réglage se voit ou s’entend avant d’être publié.</p>
        </div>
      </header>
      <StudioShell />
    </div>
  );
}
