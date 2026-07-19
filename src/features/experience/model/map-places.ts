import type {
  ContentAssignmentContract, ExperienceDocumentContract, ScenarioMasteryContract,
} from "@/shared/api/contracts";
import type { StorySummary } from "@/entities/story/model/story";
import { belongsToCategory } from "@/entities/story/model/story-category";

type Category = ExperienceDocumentContract["categories"][number];

/** Un scénario tel qu'il est présenté derrière une porte de la carte. */
export interface PlaceScenario {
  story: StorySummary;
  /** Pourcentage de maîtrise cumulée, `undefined` si jamais jouée. */
  masteryPercent?: number;
  /** L'organisation a rendu ce contenu obligatoire pour cette personne. */
  required: boolean;
  dueAt?: string;
}

/** Un lieu de la carte : une catégorie et ce qu'elle contient réellement. */
export interface Place {
  id: string;
  name: string;
  description: string;
  accent: string;
  scenarios: PlaceScenario[];
  /** Aucun scénario publié n'est rattaché : la carte le dit au lieu d'ouvrir sur du vide. */
  isEmpty: boolean;
  progressPercent: number;
}

/**
 * Rattache un scénario à une catégorie.
 *
 * La règle a été déplacée dans `entities` pour que la bibliothèque compte de la
 * même façon que la carte ; elle reste exportée ici pour ses appelants.
 */
export { belongsToCategory };

/**
 * Quand aucune catégorie ne revendique aucun scénario, la configuration n'a pas
 * encore été classée : chaque porte donne alors sur l'ensemble du catalogue, et
 * l'interface l'annonce plutôt que d'afficher des lieux vides.
 */
export function isCatalogUnclassified(categories: Category[], stories: StorySummary[]): boolean {
  if (categories.length === 0) return false;
  return !stories.some((story) => categories.some((category) => belongsToCategory(story, category)));
}

export function buildPlaces(
  categories: Category[],
  stories: StorySummary[],
  masteries: ScenarioMasteryContract[],
  assignments: ContentAssignmentContract[] = [],
): Place[] {
  const unclassified = isCatalogUnclassified(categories, stories);
  const masteryByVersion = new Map(masteries.map((item) => [item.scenarioVersionId, item]));
  const assignmentByContent = new Map(assignments.map((item) => [item.contentId, item]));

  return categories.map((category) => {
    const owned = unclassified ? stories : stories.filter((story) => belongsToCategory(story, category));
    const scenarios: PlaceScenario[] = owned.map((story) => {
      const mastery = story.scenarioVersionId ? masteryByVersion.get(story.scenarioVersionId) : undefined;
      const assignment = assignmentByContent.get(story.scenarioId ?? story.slug) ?? assignmentByContent.get(category.id);
      return {
        story,
        masteryPercent: mastery?.masteryPercent,
        required: assignment?.required ?? false,
        dueAt: assignment?.dueAt,
      };
    });
    const measured = scenarios.filter((item) => item.masteryPercent !== undefined);
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      accent: category.accent,
      scenarios,
      isEmpty: scenarios.length === 0,
      progressPercent: measured.length
        ? Math.round(measured.reduce((sum, item) => sum + (item.masteryPercent ?? 0), 0) / measured.length)
        : 0,
    };
  });
}

/** Filtre de recherche appliqué à l'intérieur d'un lieu. */
export function searchScenarios(scenarios: PlaceScenario[], query: string): PlaceScenario[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return scenarios;
  return scenarios.filter(({ story }) =>
    `${story.title} ${story.synopsis}`.toLocaleLowerCase().includes(needle));
}
