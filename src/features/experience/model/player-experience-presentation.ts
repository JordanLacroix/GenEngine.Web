import type { JournalEntryContract, ScenarioMasteryContract } from "@/shared/api/contracts";

export const worldMapSize = { width: 1536, height: 1024 } as const;
// Une ancre par domaine du plan. Il en faut au moins autant que de catégories
// publiées : la configuration de référence en compte six.
//
// Ces six coordonnées ne sont pas choisies après coup sur une image existante :
// elles sont les centres des six champs dessinés dans `diapason-domains.svg`, et
// les deux fichiers se modifient ensemble. L'anneau évite délibérément le coin
// supérieur gauche, occupé par le titre de la carte.
export const worldDoorAnchors = [
  { x: 768, y: 268 }, { x: 1200, y: 360 }, { x: 1240, y: 700 },
  { x: 830, y: 800 }, { x: 420, y: 716 }, { x: 392, y: 430 },
] as const;
// En portrait, `projectMapPoint` recadre en `cover` sur la largeur : seule une
// bande centrale du plan reste visible, en pratique `x` entre 530 et 1005 sur un
// téléphone courant. Les ancres larges tomberaient hors champ — d'où deux
// colonnes resserrées, qui restent dans cette bande à toutes les tailles.
//
// La grille est aussi décalée vers le bas : sur mobile le titre de la carte
// occupe le premier tiers de l'écran et la barre d'onglets le dernier huitième.
// Trois rangées placées naïvement au centre de l'image passaient sous le texte
// du titre, où elles restaient cliquables mais illisibles.
export const compactWorldDoorAnchors = [
  { x: 658, y: 416 }, { x: 879, y: 416 }, { x: 658, y: 618 },
  { x: 879, y: 618 }, { x: 658, y: 820 }, { x: 879, y: 820 },
] as const;

export function doorAnchorsForViewport(viewport: { width: number; height: number }) {
  return viewport.width < viewport.height ? compactWorldDoorAnchors : worldDoorAnchors;
}

/**
 * Position d'une porte, y compris au-delà des six domaines dessinés.
 *
 * Un simple `anchors[index % anchors.length]` empilait deux portes au pixel près
 * dès qu'une catégorie de plus était publiée : la sixième retombait exactement
 * sur la première et la rendait inatteignable. Au-delà des ancres dessinées, on
 * décale donc chaque tour supplémentaire en spirale — moins juste qu'un champ
 * dessiné pour elle, mais jamais superposé.
 */
export function doorAnchorForIndex(index: number, viewport: { width: number; height: number }) {
  const anchors = doorAnchorsForViewport(viewport);
  const base = anchors[index % anchors.length]!;
  const lap = Math.floor(index / anchors.length);
  if (lap === 0) return base;
  const angle = (index % anchors.length) * ((2 * Math.PI) / anchors.length);
  const radius = 120 * lap;
  return {
    x: Math.round(base.x + Math.cos(angle) * radius),
    y: Math.round(base.y + Math.sin(angle) * radius),
  };
}

export function projectMapPoint(point: { x: number; y: number }, viewport: { width: number; height: number }) {
  const scale = Math.max(viewport.width / worldMapSize.width, viewport.height / worldMapSize.height);
  return { x: (viewport.width - worldMapSize.width * scale) / 2 + point.x * scale, y: (viewport.height - worldMapSize.height * scale) / 2 + point.y * scale };
}

const journalLabels: Record<string, string> = {
  ChoiceSelected: "Choix effectué", NarrationContinued: "Récit poursuivi", QuizAnswered: "Question résolue",
  TextSubmitted: "Réponse écrite", ScenarioCompleted: "Histoire terminée",
};
const familiarLabels: Record<string, string> = {
  spark: "Étincelle", owl: "Chouette", fox: "Renard", Warm: "Chaleureux",
  Playful: "Joueur", Direct: "Direct", Mysterious: "Mystérieux",
};

export function journalTypeLabel(value: string) { return journalLabels[value] ?? value.replace(/([a-z])([A-Z])/g, "$1 $2"); }
export function familiarOptionLabel(value: string) { return familiarLabels[value] ?? value; }

export function uniqueJournalEntries(entries: JournalEntryContract[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = [entry.type, entry.sessionId, entry.referenceId, entry.scenarioVersionId, entry.title, entry.summary, entry.occurredAt].map((part) => part?.trim().toLocaleLowerCase() ?? "").join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function uniqueMasteries(masteries: ScenarioMasteryContract[]) {
  const byVersion = new Map<string, ScenarioMasteryContract>();
  for (const mastery of masteries) {
    const current = byVersion.get(mastery.scenarioVersionId);
    if (!current || Date.parse(mastery.updatedAt) > Date.parse(current.updatedAt)) byVersion.set(mastery.scenarioVersionId, mastery);
  }
  return [...byVersion.values()];
}
