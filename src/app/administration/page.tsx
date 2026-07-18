import type { Metadata } from "next";
import { Settings2 } from "lucide-react";
import { AdministrationConsole } from "@/features/administration/ui/administration-console";

export const metadata: Metadata = { title: "Administration" };

export default function AdministrationPage() {
  return <div className="page-shell inner-page admin-page">
    <header className="page-intro"><div><p className="eyebrow eyebrow--accent"><Settings2 size={15} /> Centre de contrôle</p><h1>Façonnez le cadre.<br /><em>Pas les histoires.</em></h1><p>Identité du jeu, accès, IA, authentification et économie vivent ici. Le Studio reste entièrement consacré à la création narrative.</p></div></header>
    <AdministrationConsole />
  </div>;
}
