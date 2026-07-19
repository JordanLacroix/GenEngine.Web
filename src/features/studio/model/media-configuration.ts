import {
  type ExperienceDocumentContract, type MediaConfigurationContract,
  type MediaLocationConfigurationContract, type MediaLocationContract, mediaLocations,
} from "@/shared/api/contracts";

/**
 * Bloc `media` du plan de configuration.
 *
 * Ce bloc est produit par une tranche moteur distincte (GenEngine PR #46). Tant
 * qu'une instance ne l'expose pas, `document.media` est absent : le Studio le
 * signale et n'écrit rien plutôt que de faire croire à une capacité qui n'existe
 * pas côté serveur (invariants 1 et 14).
 */

export type MediaLocation = MediaLocationContract;
export type MediaLocationConfiguration = MediaLocationConfigurationContract;
export type MediaConfiguration = MediaConfigurationContract;
export { mediaLocations };

/** Libellés français des lieux, pour l'interface et l'aperçu. */
export const mediaLocationLabels: Record<MediaLocation, { name: string; description: string }> = {
  home: { name: "Accueil", description: "Première page, avant et après connexion." },
  map: { name: "Carte", description: "Le monde et ses portes vers les lieux." },
  player: { name: "Scène jouée", description: "Le fil narratif pendant une partie." },
  journal: { name: "Journal", description: "La mémoire des parties et des découvertes." },
  familiar: { name: "Familier", description: "Le compagnon et sa configuration." },
  shop: { name: "Magasin", description: "L'économie et les offres." },
};

export type MediaSupport =
  | { state: "supported"; media: MediaConfiguration }
  | { state: "absent"; reason: string };

/**
 * Détermine si l'instance expose le plan média. On ne crée jamais le bloc
 * localement : son absence est une information, pas un défaut à corriger côté
 * client.
 */
export function mediaSupport(document: ExperienceDocumentContract | undefined): MediaSupport {
  const media = document?.media;
  if (!media || typeof media !== "object") {
    return {
      state: "absent",
      reason:
        "Le plan de configuration de cette instance ne publie pas de bloc « media ». "
        + "Les ambiances, musiques et visuels par lieu ne peuvent donc pas être enregistrés ici.",
    };
  }
  return { state: "supported", media: normalizeMedia(media) };
}

/**
 * Complète les lieux manquants sans rien inventer : un lieu absent du document
 * devient une entrée vide, ce qui permet de l'éditer, et une entrée vide reste
 * vide à l'enregistrement.
 */
export function normalizeMedia(media: MediaConfiguration): MediaConfiguration {
  const known = new Map(media.locations?.map((entry) => [entry.location, entry]) ?? []);
  return {
    enabled: Boolean(media.enabled),
    defaultMuted: media.defaultMuted !== false,
    locations: mediaLocations.map((location) => known.get(location) ?? { location }),
    gameOver: media.gameOver,
  };
}

export function updateMediaLocation(
  media: MediaConfiguration,
  location: MediaLocation,
  patch: Partial<MediaLocationConfiguration>,
): MediaConfiguration {
  const next = normalizeMedia(media);
  return {
    ...next,
    locations: next.locations.map((entry) => entry.location === location ? cleanEntry({ ...entry, ...patch }) : entry),
  };
}

export function updateGameOverMedia(
  media: MediaConfiguration,
  patch: Partial<Omit<MediaLocationConfiguration, "location">>,
): MediaConfiguration {
  const next = normalizeMedia(media);
  const merged = { ...next.gameOver, ...patch };
  return { ...next, gameOver: cleanEntry(merged) };
}

/** Une valeur vide est retirée : le document ne porte pas de chaîne vide. */
function cleanEntry<T extends Record<string, unknown>>(entry: T): T {
  const result = { ...entry };
  for (const [key, value] of Object.entries(result)) {
    if (value === "" || value === undefined || (typeof value === "number" && Number.isNaN(value))) {
      delete (result as Record<string, unknown>)[key];
    }
  }
  return result;
}

/** Nombre d'assignations réellement renseignées, affiché comme état de couverture. */
export function mediaCoverage(media: MediaConfiguration): { assigned: number; total: number } {
  const entries = normalizeMedia(media).locations;
  const assigned = entries.filter((entry) => entry.ambienceUrl ?? entry.musicUrl ?? entry.backgroundUrl).length;
  return { assigned, total: entries.length };
}
