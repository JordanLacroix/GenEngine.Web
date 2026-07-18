import type { JournalEntryContract, ScenarioMasteryContract } from "@/shared/api/contracts";

export const worldMapSize = { width: 1536, height: 1024 } as const;
export const worldDoorAnchors = [
  { x: 850, y: 280 }, { x: 1230, y: 400 }, { x: 390, y: 330 },
  { x: 380, y: 680 }, { x: 1070, y: 760 },
] as const;
export const compactWorldDoorAnchors = [
  { x: 850, y: 280 }, { x: 770, y: 570 }, { x: 1070, y: 760 },
  { x: 620, y: 410 }, { x: 930, y: 440 },
] as const;

export function doorAnchorsForViewport(viewport: { width: number; height: number }) {
  return viewport.width < viewport.height ? compactWorldDoorAnchors : worldDoorAnchors;
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
