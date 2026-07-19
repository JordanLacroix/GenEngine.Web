import type { StorySummary } from "@/entities/story/model/story";
import { readPageContract } from "@/shared/api/pagination";
import type { StoryPage } from "@/shared/api/genengine-client";

/**
 * Accès navigateur au catalogue paginé, via la façade `/api/catalog`.
 *
 * Seul point du client navigateur qui connaît la forme de cette route
 * (invariant 5). Les écrans choisissent une stratégie — une page à la fois,
 * chargement progressif, résolution unitaire — mais jamais l'URL.
 */

export type { StoryPage };

export interface CatalogPageRequest {
  page?: number;
  pageSize?: number;
  /** Recherche exécutée **par le backend** sur l'ensemble du catalogue. */
  query?: string;
  categoryId?: string;
}

/** Une page du catalogue. La recherche porte sur le catalogue entier, pas sur la page. */
export async function fetchCatalogPage(
  request: CatalogPageRequest = {},
  signal?: AbortSignal,
): Promise<StoryPage> {
  const parameters = new URLSearchParams();
  if (request.page !== undefined) parameters.set("page", String(request.page));
  if (request.pageSize !== undefined) parameters.set("pageSize", String(request.pageSize));
  if (request.query?.trim()) parameters.set("query", request.query.trim());
  if (request.categoryId) parameters.set("categoryId", request.categoryId);
  return read(`/api/catalog?${parameters.toString()}`, signal);
}

/**
 * Catalogue complet, assemblé côté serveur.
 *
 * À n'employer que lorsqu'un écran doit classer l'intégralité du catalogue
 * avant d'afficher quoi que ce soit. Partout ailleurs, une page suffit.
 */
export async function fetchWholeCatalog(signal?: AbortSignal): Promise<StoryPage> {
  return read("/api/catalog?all=1", signal);
}

/**
 * Retrouve des histoires par identifiant de version, sans rapatrier le catalogue.
 *
 * Un seul aller-retour, quel que soit le nombre d'identifiants. Les
 * identifiants absents du catalogue sont simplement absents du résultat.
 */
export async function fetchStoriesByVersionIds(
  versionIds: readonly string[],
  signal?: AbortSignal,
): Promise<StorySummary[]> {
  if (versionIds.length === 0) return [];
  const page = await read(`/api/catalog?versionIds=${encodeURIComponent(versionIds.join(","))}`, signal);
  return page.items;
}

/**
 * Retrouve une histoire par identifiant de version.
 *
 * Renvoie `undefined` si le catalogue ne la contient pas ; l'appelant décide
 * alors de son libellé de repli.
 */
export async function fetchStoryByVersionId(
  versionId: string,
  signal?: AbortSignal,
): Promise<StorySummary | undefined> {
  return (await fetchStoriesByVersionIds([versionId], signal))[0];
}

async function read(url: string, signal?: AbortSignal): Promise<StoryPage> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
  return readPageContract<StorySummary>(await response.json(), "GET /api/catalog");
}
