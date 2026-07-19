import type { StorySummary } from "@/entities/story/model/story";

/** Ce qu'une catégorie publiée expose du rattachement de ses scénarios. */
export interface StoryCategoryBinding {
  id: string;
  scenarioIds: string[];
}

/**
 * Rattache un scénario à une catégorie.
 *
 * Deux liaisons coexistent dans les contrats : la catégorie peut énumérer ses
 * `scenarioIds`, et le catalogue peut porter un `categoryId`. Les deux sont
 * exprimées en identifiant de *scénario*, jamais de version — confondre les deux
 * revient à ne rien rattacher du tout.
 *
 * La règle vit ici, et non dans une feature, parce que la carte des passages et
 * la bibliothèque doivent compter de la même façon.
 */
export function belongsToCategory(story: StorySummary, category: StoryCategoryBinding): boolean {
  const scenarioId = story.scenarioId ?? story.slug;
  if (story.categoryId && story.categoryId === category.id) return true;
  return category.scenarioIds.includes(scenarioId);
}
