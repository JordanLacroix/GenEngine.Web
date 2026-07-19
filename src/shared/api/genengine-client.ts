import type { StorySummary } from "@/entities/story/model/story";
import {
  clampPage, clampPageSize, maximumPageSize, readPageContract, type PageContract,
} from "@/shared/api/pagination";

interface PublishedScenarioContract {
  scenarioId: string;
  versionId: string;
  versionNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  publishedAt: string;
  snapshotHash: string;
  categoryId?: string | null;
}

/** Paramètres acceptés par `GET /catalog`. `offset`/`limit` n'existent plus. */
export interface CatalogQuery {
  page?: number;
  pageSize?: number;
  /** Recherche sous-chaîne insensible à la casse, appliquée **par le backend**. */
  query?: string;
  categoryId?: string;
}

export type StoryPage = PageContract<StorySummary>;

/**
 * Garde-fou du chargement exhaustif : 100 pages de 100 éléments couvrent
 * 10 000 scénarios. Au-delà, l'écran concerné doit passer à une pagination
 * explicite plutôt qu'à un balayage complet.
 */
export const maximumCatalogPages = 100;

export interface GenEngineClient {
  listPublishedStories(query?: CatalogQuery, signal?: AbortSignal): Promise<StoryPage>;
  listWholeCatalog(signal?: AbortSignal): Promise<StoryPage>;
  findStoriesByVersionIds(versionIds: readonly string[], signal?: AbortSignal): Promise<StorySummary[]>;
}

/** Nombre maximal d'identifiants résolus en une requête, pour borner le balayage. */
export const maximumVersionLookups = 100;

export class HttpGenEngineClient implements GenEngineClient {
  public constructor(private readonly baseUrl: string) {}

  public async listPublishedStories(query: CatalogQuery = {}, signal?: AbortSignal): Promise<StoryPage> {
    const page = clampPage(query.page);
    const pageSize = clampPageSize(query.pageSize);
    const parameters = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (query.query?.trim()) parameters.set("query", query.query.trim());
    if (query.categoryId) parameters.set("categoryId", query.categoryId);

    const payload = await this.get<unknown>(`/catalog?${parameters.toString()}`, signal);
    const decoded = readPageContract<PublishedScenarioContract>(payload, "GET /catalog");
    return {
      page: decoded.page,
      pageSize: decoded.pageSize,
      total: decoded.total,
      // L'alternance décorative se calcule sur le rang **absolu** dans le
      // catalogue : indexée sur la page, une histoire changeait de teinte selon
      // la page où elle apparaissait.
      items: decoded.items.map((story, index) =>
        toStorySummary(story, (decoded.page - 1) * decoded.pageSize + index)),
    };
  }

  /**
   * Parcourt toutes les pages du catalogue.
   *
   * Réservé aux écrans qui doivent classer l'intégralité du catalogue avant
   * d'afficher quoi que ce soit — la carte des passages en est le seul cas.
   * Ailleurs, préférer une page à la fois et la recherche serveur.
   */
  public async listWholeCatalog(signal?: AbortSignal): Promise<StoryPage> {
    const first = await this.listPublishedStories({ page: 1, pageSize: maximumPageSize }, signal);
    const items = [...first.items];
    for (let page = 2; items.length < first.total && page <= maximumCatalogPages; page += 1) {
      const next = await this.listPublishedStories({ page, pageSize: maximumPageSize }, signal);
      if (next.items.length === 0) break;
      items.push(...next.items);
    }
    return { items, page: 1, pageSize: items.length, total: first.total };
  }

  /**
   * Retrouve des histoires par identifiants de version.
   *
   * Le backend n'expose pas de lecture unitaire du catalogue ; la résolution se
   * fait donc en parcourant les pages **côté serveur**, en un seul balayage pour
   * tous les identifiants demandés, et en s'arrêtant dès qu'ils sont tous
   * trouvés. Un écran qui n'a besoin que de quelques titres ne télécharge donc
   * pas le catalogue dans le navigateur.
   *
   * Une route `GET /catalog/{versionId}` côté backend supprimerait ce balayage ;
   * c'est la vraie correction, hors périmètre de ce dépôt.
   */
  public async findStoriesByVersionIds(
    versionIds: readonly string[],
    signal?: AbortSignal,
  ): Promise<StorySummary[]> {
    const wanted = new Set(versionIds);
    if (wanted.size === 0) return [];
    const found: StorySummary[] = [];
    let total = Number.POSITIVE_INFINITY;
    let loaded = 0;
    for (let page = 1; loaded < total && page <= maximumCatalogPages; page += 1) {
      const current = await this.listPublishedStories({ page, pageSize: maximumPageSize }, signal);
      total = current.total;
      loaded += current.items.length;
      for (const story of current.items) {
        if (wanted.delete(story.id)) found.push(story);
      }
      if (wanted.size === 0 || current.items.length === 0) break;
    }
    return found;
  }

  private async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(new URL(path, this.baseUrl), { signal });
    if (!response.ok) throw new Error(`GenEngine API returned ${response.status}`);
    return response.json() as Promise<T>;
  }
}

function toStorySummary(story: PublishedScenarioContract, rank: number): StorySummary {
  return {
    id: story.versionId,
    slug: story.scenarioId,
    title: story.title,
    eyebrow: `Version ${story.versionNumber}`,
    synopsis: story.description,
    author: "Communauté GenEngine",
    durationMinutes: story.estimatedMinutes,
    mood: rank % 2 === 0 ? "mystery" : "wonder",
    accent: rank % 2 === 0 ? "ember" : "verdigris",
    scenarioVersionId: story.versionId,
    scenarioId: story.scenarioId,
    categoryId: story.categoryId ?? undefined,
  };
}

// Replace this boundary with a generated OpenAPI client when contracts are frozen.
// Narrative rules remain exclusively in the backend.
