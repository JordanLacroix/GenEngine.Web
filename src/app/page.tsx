import { ArrowRight, Headphones, Sparkles } from "lucide-react";
import Link from "next/link";
import { featuredStories } from "@/shared/mocks/stories";
import { StoryCard } from "@/shared/ui/story-card";
import type { PublishedExperienceContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { gameCopy } from "@/shared/lib/game-copy";

export default async function DiscoverPage() {
  const experience = await genEngineRequest<PublishedExperienceContract>("configuration", "/experience/default", {}, false).catch(() => undefined);
  const copy = (key: string, fallback: string) => gameCopy(experience?.document, key, fallback);
  return (
    <>
      <section className="hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow eyebrow--accent"><Sparkles size={15} aria-hidden="true" /> {copy("welcome.eyebrow", "Vos choix. Votre histoire.")}</p>
          <h1>{copy("welcome.title", "Des mondes qui se souviennent de vous.")}</h1>
          <p className="hero-lead">{copy("welcome.subtitle", "Chaque choix laisse une trace dans une histoire vivante.")}</p>
          <div className="hero-actions">
            <Link className="button button--primary" href="/play/demo">{copy("action.start", "Commencer")} <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link className="button button--quiet" href="/studio">{copy("studio.title", "Créer une histoire")}</Link>
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
        <div className="section-heading"><div><p className="eyebrow">{experience?.document.game.name ?? "GenEngine"}</p><h2 id="selection-title">{copy("home.discover", "À découvrir")}</h2></div><Link href="/library">{copy("nav.library", "Bibliothèque")} <ArrowRight size={16} aria-hidden="true" /></Link></div>
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
