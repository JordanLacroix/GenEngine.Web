import type { Metadata } from "next";
import { Feather } from "lucide-react";
import { StudioWorkbench } from "@/features/studio/ui/studio-workbench";

export const metadata: Metadata = { title: "Studio auteur" };

export default function StudioPage() {
  return (
    <div className="page-shell inner-page studio-page">
      <header className="page-intro studio-intro"><div><p className="eyebrow eyebrow--accent"><Feather size={15} aria-hidden="true" /> Espace auteur connecté</p><h1>Donnez une voix<br /><em>à vos mondes.</em></h1><p>Importez un document Narrative, interrogez directement le moteur, puis publiez un snapshot immuable.</p></div></header>
      <StudioWorkbench />
    </div>
  );
}
