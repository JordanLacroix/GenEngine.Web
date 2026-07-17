import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, CircleCheck, Clock3, Feather, GitBranch, Plus, WandSparkles } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Studio auteur" };

export default function StudioPage() {
  return (
    <div className="page-shell inner-page studio-page">
      <header className="page-intro studio-intro"><div><p className="eyebrow eyebrow--accent"><Feather size={15} aria-hidden="true" /> Espace auteur</p><h1>Donnez une voix<br /><em>à vos mondes.</em></h1><p>Le Studio transforme vos idées en expériences interactives — sans vous éloigner de l&apos;écriture.</p></div><button type="button" className="button button--primary"><Plus size={18} aria-hidden="true" /> Nouveau récit</button></header>
      <section className="studio-workbench" aria-labelledby="draft-title">
        <div className="draft-card"><div className="draft-art" aria-hidden="true"><span>II</span></div><div className="draft-main"><p className="eyebrow">Brouillon actif</p><h2 id="draft-title">La cité sous les racines</h2><p>Dernière modification il y a 2 heures</p><div className="draft-stats"><span><GitBranch size={16} aria-hidden="true" /><b>14</b> scènes</span><span><WandSparkles size={16} aria-hidden="true" /><b>6</b> chemins</span><span><Clock3 size={16} aria-hidden="true" /><b>22 min</b> estimées</span></div><div className="progress-block"><div className="progress-meta"><span>Préparation avant publication</span><span>68 %</span></div><div className="progress-track"><span style={{ width: "68%" }} /></div></div></div><Link className="button button--quiet" href="/studio">Continuer <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <aside className="readiness"><p className="eyebrow">État du monde</p><h3>Presque prêt à prendre vie</h3><ul><li><CircleCheck aria-hidden="true" /> Entrée et fins définies</li><li><CircleCheck aria-hidden="true" /> Tous les choix reliés</li><li className="is-pending"><BookOpenCheck aria-hidden="true" /> 3 scènes à relire</li></ul><button type="button" className="text-button">Voir le rapport de validation <ArrowRight size={15} /></button></aside>
      </section>
      <section className="studio-principles"><article><span>01</span><h3>Écrivez naturellement</h3><p>Commencez par les scènes. Les embranchements restent lisibles et au service du récit.</p></article><article><span>02</span><h3>Voyez les conséquences</h3><p>Prévisualisez chaque chemin avant qu&apos;un lecteur ne l&apos;emprunte.</p></article><article><span>03</span><h3>Publiez avec confiance</h3><p>La validation signale les impasses sans inventer les règles de votre histoire.</p></article></section>
    </div>
  );
}
