import { ArrowRight, Headphones, Sparkles } from "lucide-react";
import Link from "next/link";
import { featuredStories } from "@/shared/mocks/stories";
import { StoryCard } from "@/shared/ui/story-card";

export default function DiscoverPage() {
  return (
    <>
      <section className="hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow eyebrow--accent"><Sparkles size={15} aria-hidden="true" /> Récits interactifs nouvelle génération</p>
          <h1>Des mondes qui <em>se souviennent</em> de vous.</h1>
          <p className="hero-lead">Chaque choix laisse une trace. Explorez des histoires vivantes, écrites par des auteurs et façonnées par votre instinct.</p>
          <div className="hero-actions">
            <Link className="button button--primary" href="/play/demo">Commencer l&apos;aventure <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className="button button--quiet" href="/studio">Créer une histoire</Link>
          </div>
          <div className="hero-proof"><span className="avatar-stack"><i>MV</i><i>NA</i><i>IR</i></span><span><strong>147 mondes</strong><br />attendent leur prochain choix</span></div>
        </div>
        <div className="hero-visual" aria-label="À la une : Le dernier phare">
          <div className="moon" aria-hidden="true" />
          <div className="lighthouse" aria-hidden="true"><span className="light-beam" /><span className="tower" /></div>
          <div className="featured-plaque"><span>À la une</span><strong>Le dernier phare</strong><small><Headphones size={13} aria-hidden="true" /> 28 min · Mystère maritime</small></div>
        </div>
      </section>

      <section className="page-shell section-block" aria-labelledby="selection-title">
        <div className="section-heading"><div><p className="eyebrow">Sélection des veilleurs</p><h2 id="selection-title">Choisissez votre prochaine vie</h2></div><Link href="/library">Toute la collection <ArrowRight size={16} aria-hidden="true" /></Link></div>
        <div className="story-grid">{featuredStories.map((story, index) => <StoryCard key={story.id} story={story} priority={index === 0} />)}</div>
      </section>

      <section className="page-shell manifesto">
        <p className="eyebrow">Votre histoire, autrement</p>
        <blockquote>« Il n&apos;y a pas de mauvais choix.<br />Seulement des chemins que vous seul pouvez ouvrir. »</blockquote>
        <div className="manifesto-points"><span><b>01</b> Des décisions qui comptent</span><span><b>02</b> Des récits à rejouer</span><span><b>03</b> Votre progression préservée</span></div>
      </section>
    </>
  );
}
