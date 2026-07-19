import { describe, expect, it } from "vitest";
import {
  draftMediaCoverage, isKnownAnimationCue, narrativeDraft, serializeDraft, updateChoice, updateNode,
} from "./narrative-draft";

const source = serializeDraft({
  schemaVersion: 2,
  title: "Le Diapason",
  initialNodeId: "start",
  nodes: [
    { id: "start", text: "Un couloir.", visualUrl: "diapason:hall", visualDescription: "Un couloir vide.", choices: [{ id: "c1", text: "Avancer", targetNodeId: "end", soundUrl: "diapason:ui-click", animationCue: "rise" }] },
    { id: "end", text: "Fin.", isEnding: true, choices: [] },
  ],
});

describe("narrativeDraft", () => {
  it("conserve les champs inconnus du client", () => {
    const draft = narrativeDraft(JSON.stringify({ schemaVersion: 2, nodes: [{ id: "a", text: "", choices: [], effects: [{ kind: "grant" }] }] }));
    expect(draft.nodes[0]?.effects).toEqual([{ kind: "grant" }]);
  });

  it("rend un brouillon vide pour un JSON illisible", () => {
    expect(narrativeDraft("{ pas du json").nodes).toEqual([]);
  });
});

describe("updateNode / updateChoice", () => {
  it("attache un visuel et sa description à une scène", () => {
    const next = updateNode(narrativeDraft(source), "end", { visualUrl: "https://cdn.example/end.png", visualDescription: "Une porte." });
    expect(next.nodes[1]?.visualUrl).toBe("https://cdn.example/end.png");
    expect(next.nodes[0]?.visualUrl).toBe("diapason:hall");
  });

  it("retire un média vidé au lieu de laisser une chaîne vide dans le document", () => {
    const next = updateNode(narrativeDraft(source), "start", { visualUrl: "" });
    expect(next.nodes[0]).not.toHaveProperty("visualUrl");
  });

  it("attache un son et un repère d'animation à un choix", () => {
    const next = updateChoice(narrativeDraft(source), "start", 0, { animationCue: "shake" });
    expect(next.nodes[0]?.choices[0]?.animationCue).toBe("shake");
    expect(next.nodes[0]?.choices[0]?.soundUrl).toBe("diapason:ui-click");
  });
});

describe("isKnownAnimationCue", () => {
  it("distingue un repère jouable d'un repère inconnu", () => {
    expect(isKnownAnimationCue("pulse")).toBe(true);
    expect(isKnownAnimationCue("tourbillon-maison")).toBe(false);
    expect(isKnownAnimationCue(undefined)).toBe(false);
  });
});

describe("draftMediaCoverage", () => {
  it("mesure la couverture média et les visuels sans description", () => {
    const draft = updateNode(narrativeDraft(source), "end", { visualUrl: "https://cdn.example/end.png" });
    expect(draftMediaCoverage(draft)).toEqual({
      nodes: 2, nodesWithVisual: 2, choices: 1, choicesWithSound: 1, choicesWithCue: 1, visualsWithoutDescription: 1,
    });
  });
});
