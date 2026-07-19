"use client";

import { Bookmark, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { StorySummary } from "@/entities/story/model/story";
import { featuredStories } from "@/shared/mocks/stories";
import { StoryCard } from "@/shared/ui/story-card";
import type { PublishedExperienceContract } from "@/shared/api/contracts";
import { gameCopy } from "@/shared/lib/game-copy";

type CatalogState = "loading" | "connected" | "fixtures";

export function LibraryContent() {
  const [catalog, setCatalog] = useState<StorySummary[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>("loading");
  const [query, setQuery] = useState("");
  const [startedIds, setStartedIds] = useState<Set<string>>(new Set());
  const [experience, setExperience] = useState<PublishedExperienceContract>();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
        return response.json() as Promise<StorySummary[]>;
      })
      .then((stories) => {
        setCatalog(stories);
        setStartedIds(new Set(stories.filter((story) => window.localStorage.getItem(`genengine.session.${story.id}`)).map((story) => story.id)));
        setCatalogState("connected");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCatalogState("fixtures");
      });
    void fetch("/api/experience", { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<PublishedExperienceContract> : undefined).then(setExperience).catch(() => undefined);
    return () => controller.abort();
  }, []);

  // Une fixture n'est jamais affichée pendant le chargement ni à la place d'une
  // erreur : elle n'apparaît qu'en mode démonstration explicitement annoncé.
  const published = useMemo(() => {
    if (catalogState === "connected") return catalog;
    if (catalogState === "fixtures") return [featuredStories[0]!];
    return [];
  }, [catalog, catalogState]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    if (!normalized) return published;
    return published.filter((story) => `${story.title} ${story.synopsis}`.toLocaleLowerCase("fr").includes(normalized));
  }, [published, query]);
  const continued = useMemo(() => published.filter((story) => startedIds.has(story.id)), [published, startedIds]);
  const categoryProgress = useMemo(() => (experience?.document.categories ?? []).filter((category) => category.isVisible).map((category) => {
    const stories = published.filter((story) => category.scenarioIds.includes(story.slug));
    const started = stories.filter((story) => startedIds.has(story.id)).length;
    return { ...category, total: stories.length, started, progress: stories.length ? Math.round((started / stories.length) * 100) : 0 };
  }), [experience, published, startedIds]);
  const copy = (key: string, fallback: string) => gameCopy(experience?.document, key, fallback);

  return (
    <div className="page-shell inner-page">
      <header className="page-intro"><div><p className="eyebrow eyebrow--accent"><Bookmark size={15} aria-hidden="true" /> {experience?.document.game.name ?? "Votre collection"}</p><h1>{copy("nav.library", "Bibliothèque")}</h1><p>{experience?.document.game.description ?? "Retrouvez les histoires publiées."}</p></div><label className="search-field"><span className="sr-only">Rechercher</span><Search size={18} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Rechercher ${copy("entity.story.singular", "une histoire").toLowerCase()}…`} /></label></header>
      <div className="library-tabs" role="status" aria-live="polite"><button className="is-active" type="button">Catalogue <span>{published.length}</span></button><span className="catalog-source">{catalogState === "loading" ? "Connexion au moteur…" : catalogState === "connected" ? "Catalogue moteur" : "Mode démonstration"}</span></div>
      {categoryProgress.length > 0 && <section className="category-progress" aria-label="Progression par catégorie">{categoryProgress.map((category) => <article key={category.id}><div><span className="category-gem" data-accent={category.accent} /><strong>{category.name}</strong><small>{category.started} commencé{category.started > 1 ? "s" : ""} · {category.total} scénario{category.total > 1 ? "s" : ""}</small></div><div className="progress-track" aria-label={`${category.progress} %`}><span style={{ width: `${category.progress}%` }} /></div><b>{category.progress}%</b></article>)}</section>}
      <section className="section-block" aria-labelledby="continue-title"><div className="section-heading"><div><p className="eyebrow">{copy("library.resume", "Reprendre le fil")}</p><h2 id="continue-title">{copy("entity.story.plural", "Histoires")} en cours</h2></div></div>{continued.length > 0 ? <div className="story-grid story-grid--library">{continued.map((story) => <StoryCard key={story.id} story={story} />)}</div> : <p className="empty-state">Les sessions commencées sur cet appareil apparaîtront ici.</p>}</section>
      <section className="section-block" aria-labelledby="saved-title"><div className="section-heading"><div><p className="eyebrow">{copy("status.soon", "Nouveautés")}</p><h2 id="saved-title">{copy("home.discover", "À découvrir")}</h2></div></div>{filtered.length === 0 ? <p className="empty-state">Aucun contenu ne correspond à votre recherche.</p> : <div className="story-grid story-grid--library">{filtered.map((story) => <StoryCard key={story.id} story={story} />)}</div>}</section>
    </div>
  );
}
