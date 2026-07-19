"use client";

import { Bookmark, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StorySummary } from "@/entities/story/model/story";
import { belongsToCategory } from "@/entities/story/model/story-category";
import { featuredStories } from "@/shared/mocks/stories";
import { StoryCard } from "@/shared/ui/story-card";
import type { PublishedExperienceContract } from "@/shared/api/contracts";
import { fetchCatalogPage, fetchStoriesByVersionIds } from "@/shared/api/catalog-browser";
import { hasMore } from "@/shared/api/pagination";
import { readStartedVersionIds } from "@/shared/lib/local-sessions";
import { gameCopy } from "@/shared/lib/game-copy";

type CatalogState = "loading" | "connected" | "fixtures";

/**
 * Taille de page de la bibliothèque.
 *
 * Le catalogue est conçu pour porter des centaines de récits par parcours. La
 * liste « À découvrir » se charge donc **page par page**, avec un bouton
 * « Charger la suite », et le nombre affiché est le `total` du serveur — jamais
 * le nombre d'éléments déjà chargés.
 */
const libraryPageSize = 24;

/** Délai avant qu'une frappe devienne une recherche serveur. */
const searchDebounceMs = 300;

/**
 * Ce que le serveur a répondu pour une recherche donnée.
 *
 * Succès et échec vivent dans **un seul** état, porteur de la recherche
 * concernée. Toute réponse portant une autre recherche que celle demandée est
 * donc, par construction, un chargement en cours : un échec passé ne peut pas
 * afficher le mode démonstration pendant qu'une nouvelle requête est en vol.
 */
type CatalogOutcome =
  | { query: string; failed: true }
  | { query: string; failed: false; items: StorySummary[]; page: number; total: number };

export function LibraryContent() {
  // L'état de chargement est **dérivé** de la comparaison entre la recherche
  // demandée et celle déjà servie : le stocker obligerait à le remettre à
  // « loading » depuis l'effet, ce qui déclenche des rendus en cascade.
  const [outcome, setOutcome] = useState<CatalogOutcome>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [startedStories, setStartedStories] = useState<StorySummary[]>([]);
  const [experience, setExperience] = useState<PublishedExperienceContract>();
  const requestId = useRef(0);

  const served = outcome?.query === appliedQuery ? outcome : undefined;
  const catalogState: CatalogState = !served ? "loading" : served.failed ? "fixtures" : "connected";
  const catalog = served && !served.failed ? served.items : [];
  const total = served && !served.failed ? served.total : 0;
  const page = served && !served.failed ? served.page : 1;

  // La recherche est exécutée par le backend sur l'ensemble du catalogue.
  // Filtrer localement une page de 24 éléments donnerait des résultats faux dès
  // que le catalogue en compte davantage.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedQuery(query.trim()), searchDebounceMs);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const current = (requestId.current += 1);
    fetchCatalogPage({ page: 1, pageSize: libraryPageSize, query: appliedQuery }, controller.signal)
      .then((first) => {
        if (requestId.current !== current) return;
        setOutcome({ query: appliedQuery, failed: false, items: first.items, page: first.page, total: first.total });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (requestId.current !== current) return;
        setOutcome({ query: appliedQuery, failed: true });
      });
    return () => controller.abort();
  }, [appliedQuery]);

  // Les reprises sont résolues à partir des clés locales, pas de la page
  // affichée : une histoire commencée reste visible même si elle appartient à la
  // page 7 du catalogue ou qu'une recherche est en cours.
  useEffect(() => {
    const controller = new AbortController();
    const versionIds = readStartedVersionIds(typeof window === "undefined" ? undefined : window.localStorage);
    if (versionIds.length === 0) return () => controller.abort();
    fetchStoriesByVersionIds(versionIds, controller.signal)
      .then(setStartedStories)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/experience", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<PublishedExperienceContract> : undefined)
      .then(setExperience).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const loadMore = useCallback(() => {
    const current = requestId.current;
    setLoadingMore(true);
    fetchCatalogPage({ page: page + 1, pageSize: libraryPageSize, query: appliedQuery })
      .then((next) => {
        if (requestId.current !== current) return;
        setOutcome((known) => {
          if (!known || known.failed || known.query !== appliedQuery) return known;
          // Le catalogue peut bouger entre deux pages : dédupliquer évite qu'un
          // récit republié apparaisse deux fois dans la grille.
          const seen = new Set(known.items.map((story) => story.id));
          return {
            query: appliedQuery,
            failed: false,
            items: [...known.items, ...next.items.filter((story) => !seen.has(story.id))],
            page: next.page,
            total: next.total,
          };
        });
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  }, [appliedQuery, page]);

  // Une fixture n'est jamais affichée pendant le chargement ni à la place d'une
  // erreur : elle n'apparaît qu'en mode démonstration explicitement annoncé.
  const published: StorySummary[] = catalogState === "connected"
    ? catalog
    : catalogState === "fixtures" ? [featuredStories[0]!] : [];
  const announcedTotal = catalogState === "fixtures" ? published.length : total;
  const canLoadMore = catalogState === "connected" && hasMore(catalog.length, total);

  const continued = catalogState === "fixtures" ? [] : startedStories;
  // Le dénominateur vient de l'expérience publiée — la liste des scénarios d'une
  // catégorie y est exhaustive — et non de la page chargée, qui n'en montre
  // qu'une partie. Le numérateur vient des sessions locales résolues ci-dessus.
  const categoryProgress = useMemo(() => (experience?.document.categories ?? [])
    .filter((category) => category.isVisible)
    .map((category) => {
      const totalScenarios = category.scenarioIds.length;
      const started = startedStories.filter((story) => belongsToCategory(story, category)).length;
      return {
        ...category,
        total: totalScenarios,
        started,
        progress: totalScenarios ? Math.round((Math.min(started, totalScenarios) / totalScenarios) * 100) : 0,
      };
    }), [experience, startedStories]);
  const copy = (key: string, fallback: string) => gameCopy(experience?.document, key, fallback);

  return (
    <div className="page-shell library-page">
      {/* Bandeau compact : la hauteur appartient au catalogue, pas au titre. */}
      <header className="library-hud"><div><p className="eyebrow eyebrow--accent"><Bookmark size={15} aria-hidden="true" /> {experience?.document.game.name ?? "Votre collection"}</p><h1>{copy("nav.library", "Bibliothèque")}</h1><p>{experience?.document.game.description ?? "Retrouvez les histoires publiées."}</p></div><label className="search-field"><span className="sr-only">Rechercher</span><Search size={18} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Rechercher ${copy("entity.story.singular", "une histoire").toLowerCase()}…`} /></label></header>
      {/* Le compteur affiche le `total` du serveur, pas les éléments chargés :
          annoncer « 24 » sur un catalogue de 213 serait faux sous pagination. */}
      <div className="library-tabs" role="status" aria-live="polite"><button className="is-active" type="button">Catalogue <span>{announcedTotal}</span></button><span className="catalog-source">{catalogState === "loading" ? "Connexion au moteur…" : catalogState === "connected" ? "Catalogue moteur" : "Mode démonstration"}</span></div>
      {categoryProgress.length > 0 && <section className="category-progress" aria-label="Progression par catégorie">{categoryProgress.map((category) => <article key={category.id}><div><span className="category-gem" data-accent={category.accent} /><strong>{category.name}</strong><small>{category.started} commencé{category.started > 1 ? "s" : ""} · {category.total} scénario{category.total > 1 ? "s" : ""}</small></div><div className="progress-track" aria-label={`${category.progress} %`}><span style={{ width: `${category.progress}%` }} /></div><b>{category.progress}%</b></article>)}</section>}
      <section className="section-block" aria-labelledby="continue-title"><div className="section-heading"><div><p className="eyebrow">{copy("library.resume", "Reprendre le fil")}</p><h2 id="continue-title">{copy("entity.story.plural", "Histoires")} en cours</h2></div></div>{continued.length > 0 ? <div className="story-grid story-grid--library">{continued.map((story) => <StoryCard key={story.id} story={story} />)}</div> : <p className="empty-state">Les sessions commencées sur cet appareil apparaîtront ici.</p>}</section>
      <section className="section-block" aria-labelledby="saved-title">
        <div className="section-heading"><div><p className="eyebrow">{copy("status.soon", "Nouveautés")}</p><h2 id="saved-title">{appliedQuery ? "Résultats de la recherche" : copy("home.discover", "À découvrir")}</h2></div>{catalogState === "connected" && <p className="section-count" role="status" aria-live="polite">{published.length} sur {announcedTotal}</p>}</div>
        {published.length === 0
          ? <p className="empty-state">{catalogState === "loading" ? "Connexion au moteur…" : "Aucun contenu ne correspond à votre recherche."}</p>
          : <div className="story-grid story-grid--library">{published.map((story) => <StoryCard key={story.id} story={story} />)}</div>}
        {canLoadMore && <button className="button button--quiet load-more" type="button" disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? "Chargement…" : `Charger la suite (${total - catalog.length} restant${total - catalog.length > 1 ? "s" : ""})`}
        </button>}
      </section>
    </div>
  );
}
