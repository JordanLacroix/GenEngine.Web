"use client";

import { Bookmark, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { StorySummary } from "@/entities/story/model/story";
import { featuredStories } from "@/shared/mocks/stories";
import { StoryCard } from "@/shared/ui/story-card";

type CatalogState = "loading" | "connected" | "fixtures";

export function LibraryContent() {
  const [catalog, setCatalog] = useState<StorySummary[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>("loading");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
        return response.json() as Promise<StorySummary[]>;
      })
      .then((stories) => {
        setCatalog(stories);
        setCatalogState("connected");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCatalogState("fixtures");
      });
    return () => controller.abort();
  }, []);

  const published = useMemo(
    () => catalogState === "connected" ? catalog : [featuredStories[0]!],
    [catalog, catalogState],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    if (!normalized) return published;
    return published.filter((story) => `${story.title} ${story.synopsis}`.toLocaleLowerCase("fr").includes(normalized));
  }, [published, query]);

  return (
    <div className="page-shell inner-page">
      <header className="page-intro"><div><p className="eyebrow eyebrow--accent"><Bookmark size={15} aria-hidden="true" /> Votre collection</p><h1>Bibliothèque</h1><p>Retrouvez les mondes commencés et les dernières histoires publiées par le moteur.</p></div><label className="search-field"><span className="sr-only">Rechercher une histoire</span><Search size={18} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un monde…" /></label></header>
      <div className="library-tabs" role="status" aria-live="polite"><button className="is-active" type="button">Catalogue <span>{published.length}</span></button><span className="catalog-source">{catalogState === "loading" ? "Connexion au moteur…" : catalogState === "connected" ? "Catalogue moteur" : "Mode démonstration"}</span></div>
      <section className="section-block" aria-labelledby="continue-title"><div className="section-heading"><div><p className="eyebrow">Reprendre le fil</p><h2 id="continue-title">Vos histoires en cours</h2></div></div><div className="story-grid story-grid--library">{featuredStories.filter((story) => story.progress !== undefined).map((story) => <StoryCard key={story.id} story={story} />)}</div></section>
      <section className="section-block" aria-labelledby="saved-title"><div className="section-heading"><div><p className="eyebrow">Fraîchement publié</p><h2 id="saved-title">À découvrir</h2></div></div>{filtered.length === 0 ? <p className="empty-state">Aucune histoire ne correspond à votre recherche.</p> : <div className="story-grid story-grid--library">{filtered.map((story) => <StoryCard key={story.id} story={story} />)}</div>}</section>
    </div>
  );
}
