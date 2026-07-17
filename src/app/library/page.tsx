import type { Metadata } from "next";
import { Bookmark, Search } from "lucide-react";
import { featuredStories } from "@/shared/mocks/stories";
import { StoryCard } from "@/shared/ui/story-card";

export const metadata: Metadata = { title: "Bibliothèque" };

export default function LibraryPage() {
  return (
    <div className="page-shell inner-page">
      <header className="page-intro"><div><p className="eyebrow eyebrow--accent"><Bookmark size={15} aria-hidden="true" /> Votre collection</p><h1>Bibliothèque</h1><p>Retrouvez les mondes commencés et ceux que vous avez gardés pour plus tard.</p></div><label className="search-field"><span className="sr-only">Rechercher une histoire</span><Search size={18} aria-hidden="true" /><input type="search" placeholder="Rechercher un monde…" /></label></header>
      <div className="library-tabs" role="tablist" aria-label="Filtrer la bibliothèque"><button className="is-active" type="button" role="tab" aria-selected="true">En cours <span>2</span></button><button type="button" role="tab" aria-selected="false">À découvrir <span>1</span></button><button type="button" role="tab" aria-selected="false">Terminées <span>0</span></button></div>
      <section className="section-block" aria-labelledby="continue-title"><div className="section-heading"><div><p className="eyebrow">Reprendre le fil</p><h2 id="continue-title">Vos histoires en cours</h2></div></div><div className="story-grid story-grid--library">{featuredStories.filter((story) => story.progress !== undefined).map((story) => <StoryCard key={story.id} story={story} />)}</div></section>
      <section className="section-block" aria-labelledby="saved-title"><div className="section-heading"><div><p className="eyebrow">Gardé pour la nuit</p><h2 id="saved-title">À découvrir</h2></div></div><div className="story-grid story-grid--library"><StoryCard story={featuredStories[0]!} /></div></section>
    </div>
  );
}
