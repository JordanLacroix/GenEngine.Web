/**
 * Convention de pagination unique du backend GenEngine.
 *
 * Toutes les listes volumineuses répondent la même enveloppe
 * `{ items, page, pageSize, total }` et acceptent les mêmes paramètres
 * `page` (base 1) / `pageSize` (borné) / `query`. `offset` et `limit`
 * n'existent plus.
 *
 * Ce module est le seul endroit du client qui connaît ces bornes.
 */

/** Enveloppe paginée renvoyée par le backend, et relayée telle quelle par la façade. */
export interface PageContract<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Défaut du backend lorsqu'aucune taille n'est demandée. */
export const defaultPageSize = 25;
/** Borne haute appliquée par le backend ; la reproduire évite un aller-retour inutile. */
export const maximumPageSize = 100;

export function clampPageSize(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return defaultPageSize;
  return Math.min(maximumPageSize, Math.max(1, Math.trunc(value)));
}

export function clampPage(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.trunc(value));
}

/** Lit un entier de chaîne de requête sans jamais produire `NaN`. */
export function readPositiveInteger(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Nombre total de pages, `1` au minimum pour qu'un catalogue vide reste navigable. */
export function pageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Reste-t-il des éléments après ceux déjà chargés ? */
export function hasMore(loaded: number, total: number): boolean {
  return loaded < total;
}

/**
 * Décode une enveloppe paginée.
 *
 * Un tableau nu — la forme d'avant la rupture de contrat — échoue explicitement
 * au lieu d'être réinterprété : invariant 14. Sans cela, un backend resté sur
 * l'ancienne version produirait silencieusement un catalogue vide.
 */
export function readPageContract<T>(value: unknown, source: string): PageContract<T> {
  if (Array.isArray(value)) {
    throw new Error(
      `${source} returned a bare array; this client requires the paginated envelope { items, page, pageSize, total }.`,
    );
  }
  if (typeof value !== "object" || value === null) {
    throw new Error(`${source} returned a non-object payload.`);
  }
  const candidate = value as Partial<PageContract<T>>;
  if (
    !Array.isArray(candidate.items)
    || typeof candidate.page !== "number"
    || typeof candidate.pageSize !== "number"
    || typeof candidate.total !== "number"
  ) {
    throw new Error(`${source} returned an unexpected pagination envelope.`);
  }
  return { items: candidate.items, page: candidate.page, pageSize: candidate.pageSize, total: candidate.total };
}
