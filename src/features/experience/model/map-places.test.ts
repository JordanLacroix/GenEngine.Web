import { describe, expect, it } from "vitest";
import type { ExperienceDocumentContract, ScenarioMasteryContract } from "@/shared/api/contracts";
import type { StorySummary } from "@/entities/story/model/story";
import { belongsToCategory, buildPlaces, isCatalogUnclassified, searchScenarios } from "./map-places";

type Category = ExperienceDocumentContract["categories"][number];

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-1", name: "Mystères", description: "Enquêtes.", accent: "or",
    order: 1, isVisible: true, tags: [], scenarioIds: [], ...overrides,
  };
}

function story(overrides: Partial<StorySummary> = {}): StorySummary {
  return {
    id: "version-1", slug: "scenario-1", scenarioId: "scenario-1", title: "Le sentier",
    eyebrow: "Version 1", synopsis: "Deux sentiers.", author: "GenEngine", durationMinutes: 5,
    mood: "mystery", accent: "ember", scenarioVersionId: "version-1", ...overrides,
  };
}

function mastery(overrides: Partial<ScenarioMasteryContract> = {}): ScenarioMasteryContract {
  return {
    scenarioId: "scenario-1", scenarioVersionId: "version-1", choiceIds: [], nodeIds: [], endingIds: [],
    discoveredObjectives: 1, totalObjectives: 4, masteryPercent: 25, updatedAt: "2026-07-19T10:00:00Z", ...overrides,
  };
}

describe("belongsToCategory", () => {
  it("rattache par le categoryId du catalogue", () => {
    expect(belongsToCategory(story({ categoryId: "cat-1" }), category())).toBe(true);
  });

  it("rattache par les scenarioIds de la catégorie", () => {
    expect(belongsToCategory(story(), category({ scenarioIds: ["scenario-1"] }))).toBe(true);
  });

  it("ne confond pas identifiant de scénario et identifiant de version", () => {
    // Régression : la carte comparait `scenarioIds` à l'identifiant de version,
    // ce qui ne rattachait jamais rien.
    expect(belongsToCategory(story(), category({ scenarioIds: ["version-1"] }))).toBe(false);
  });
});

describe("isCatalogUnclassified", () => {
  it("détecte une configuration où rien n'est classé", () => {
    expect(isCatalogUnclassified([category(), category({ id: "cat-2" })], [story()])).toBe(true);
  });

  it("reste faux dès qu'un rattachement existe", () => {
    expect(isCatalogUnclassified([category({ scenarioIds: ["scenario-1"] })], [story()])).toBe(false);
  });

  it("reste faux sans catégorie", () => {
    expect(isCatalogUnclassified([], [story()])).toBe(false);
  });
});

describe("buildPlaces", () => {
  it("ouvre chaque porte sur le catalogue entier quand rien n'est classé", () => {
    const places = buildPlaces([category(), category({ id: "cat-2" })], [story(), story({ id: "v2", scenarioId: "s2", scenarioVersionId: "v2" })], []);
    expect(places).toHaveLength(2);
    expect(places[0]!.scenarios).toHaveLength(2);
    expect(places[0]!.isEmpty).toBe(false);
  });

  it("n'attribue que les scénarios rattachés quand le classement existe", () => {
    const places = buildPlaces(
      [category({ scenarioIds: ["scenario-1"] }), category({ id: "cat-2", scenarioIds: ["s2"] })],
      [story(), story({ id: "v2", scenarioId: "s2", scenarioVersionId: "v2", title: "Autre" })],
      [],
    );
    expect(places[0]!.scenarios.map((item) => item.story.title)).toEqual(["Le sentier"]);
    expect(places[1]!.scenarios.map((item) => item.story.title)).toEqual(["Autre"]);
  });

  it("signale un lieu sans contenu au lieu de le laisser muet", () => {
    const places = buildPlaces(
      [category({ scenarioIds: ["absent"] }), category({ id: "cat-2", scenarioIds: ["scenario-1"] })],
      [story()],
      [],
    );
    expect(places[0]!.isEmpty).toBe(true);
    expect(places[0]!.scenarios).toEqual([]);
  });

  it("moyenne la découverte sur les seuls scénarios déjà parcourus", () => {
    const places = buildPlaces(
      [category({ scenarioIds: ["scenario-1", "s2"] })],
      [story(), story({ id: "v2", scenarioId: "s2", scenarioVersionId: "v2" })],
      [mastery({ masteryPercent: 60 })],
    );
    expect(places[0]!.progressPercent).toBe(60);
    expect(places[0]!.scenarios[1]!.masteryPercent).toBeUndefined();
  });

  it("reporte l'obligation et l'échéance issues des affectations", () => {
    const places = buildPlaces([category({ scenarioIds: ["scenario-1"] })], [story()], [], [{
      id: "a1", frontId: "default", unitId: "u1", contentType: "Scenario", contentId: "scenario-1",
      name: "Le sentier", required: true, dueAt: "2026-09-01T00:00:00Z", isActive: true, revision: 1,
      updatedAt: "2026-07-19T10:00:00Z",
    }]);
    expect(places[0]!.scenarios[0]!.required).toBe(true);
    expect(places[0]!.scenarios[0]!.dueAt).toBe("2026-09-01T00:00:00Z");
  });
});

describe("searchScenarios", () => {
  const scenarios = buildPlaces([category()], [story(), story({ id: "v2", scenarioId: "s2", title: "La forge" })], [])[0]!.scenarios;

  it("rend tout pour une recherche vide", () => {
    expect(searchScenarios(scenarios, "  ")).toHaveLength(2);
  });

  it("filtre sur le titre sans tenir compte de la casse", () => {
    expect(searchScenarios(scenarios, "FORGE").map((item) => item.story.title)).toEqual(["La forge"]);
  });
});
