import { describe, expect, it } from "vitest";
import type { JournalEntryContract, ScenarioMasteryContract } from "@/shared/api/contracts";
import { doorAnchorForIndex, doorAnchorsForViewport, familiarOptionLabel, journalTypeLabel, projectMapPoint, uniqueJournalEntries, uniqueMasteries } from "./player-experience-presentation";

describe("player experience presentation", () => {
  it("keeps map anchors attached to the cover image", () => {
    expect(projectMapPoint({ x: 768, y: 512 }, { width: 2048, height: 930 })).toEqual({ x: 1024, y: 465 });
    const lighthouse = projectMapPoint({ x: 390, y: 330 }, { width: 2048, height: 930 });
    expect(lighthouse.x).toBeCloseTo(520); expect(lighthouse.y).toBeCloseTo(222.333);
    expect(doorAnchorsForViewport({ width: 768, height: 1024 })[1]).toEqual({ x: 770, y: 570 });
  });
  // La configuration de référence publie six postures. Tant qu'il n'y avait que
  // cinq ancres, la sixième porte retombait au pixel près sur la première et la
  // rendait inatteignable.
  it("gives every published category its own door", () => {
    const wide = { width: 2048, height: 930 };
    for (const viewport of [wide, { width: 768, height: 1024 }]) {
      const seen = new Set<string>();
      for (let index = 0; index < 12; index += 1) {
        const anchor = doorAnchorForIndex(index, viewport);
        const key = `${anchor.x}:${anchor.y}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
      expect(doorAnchorsForViewport(viewport).length).toBeGreaterThanOrEqual(6);
    }
  });

  it("localizes engine values", () => {
    expect(journalTypeLabel("ChoiceSelected")).toBe("Choix effectué");
    expect(familiarOptionLabel("Mysterious")).toBe("Mystérieux");
    expect(familiarOptionLabel("spark")).toBe("Étincelle");
  });
  it("removes duplicated journal projections and masteries", () => {
    const entry = { id: "one", type: "ChoiceSelected", title: "Titre", summary: "Résumé", sessionId: "session", referenceId: "choice", scenarioVersionId: "version", occurredAt: "2026-07-18T10:00:00Z" } satisfies JournalEntryContract;
    expect(uniqueJournalEntries([entry, { ...entry, id: "two" }])).toEqual([entry]);
    const mastery = { scenarioId: "scenario", scenarioVersionId: "version", choiceIds: [], nodeIds: [], endingIds: [], discoveredObjectives: 0, totalObjectives: 1, masteryPercent: 10, updatedAt: "2026-07-18T10:00:00Z" } satisfies ScenarioMasteryContract;
    const latest = { ...mastery, masteryPercent: 20, updatedAt: "2026-07-18T11:00:00Z" };
    expect(uniqueMasteries([mastery, latest])).toEqual([latest]);
  });
});
