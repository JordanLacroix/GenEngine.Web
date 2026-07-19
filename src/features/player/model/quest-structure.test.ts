import { describe, expect, it } from "vitest";
import {
  buildQuestGraph, questTreeFromStructure, summariseQuestGraph,
  type QuestStructureInput, type QuestTreeInput, type QuestTreeNodeInput,
} from "./quest-graph";

/** Topology shared by both fixtures: merges, an ending and an unreachable node. */
const structure: QuestStructureInput = {
  initialNodeId: "shore",
  nodes: [
    { id: "shore", text: "La grève", isEnding: false },
    { id: "stairs", text: "L’escalier", isEnding: false },
    { id: "cave", text: "La grotte", isEnding: false },
    { id: "vault", text: "La voûte", isEnding: false },
    { id: "ending", text: "La sortie", isEnding: true },
    { id: "orphan", text: "Salle scellée", isEnding: false },
  ],
  edges: [
    { sourceNodeId: "shore", targetNodeId: "stairs", inputId: "descend", text: "Descendre" },
    { sourceNodeId: "shore", targetNodeId: "cave", inputId: "enter", text: "Entrer" },
    { sourceNodeId: "stairs", targetNodeId: "vault", inputId: "push", text: "Pousser" },
    { sourceNodeId: "cave", targetNodeId: "vault", inputId: "crawl", text: "Ramper" },
    { sourceNodeId: "vault", targetNodeId: "ending", inputId: "leave", text: "Sortir" },
  ],
};

/** Same topology seen from inside a run, as `GET /sessions/{id}/tree` returns it. */
function inRunTree(): QuestTreeInput {
  return {
    initialNodeId: structure.initialNodeId,
    currentNodeId: "cave",
    nodes: structure.nodes.map((node, index): QuestTreeNodeInput => ({
      id: node.id,
      text: node.text,
      isEnding: node.isEnding,
      state: index === 0 ? "Visited" : index === 2 ? "Current" : index === 5 ? "Locked" : "Unexplored",
    })),
    edges: structure.edges.map((edge) => ({ ...edge, isAvailable: true, evaluation: { explanation: "" } })),
  };
}

describe("questTreeFromStructure", () => {
  it("carries no run state: no current node and nothing visited", () => {
    const tree = questTreeFromStructure(structure);
    expect(tree.currentNodeId).toBeUndefined();
    expect(tree.nodes.every((node) => node.state === "Unexplored")).toBe(true);
  });

  it("preserves the identifiers, the order and the passages", () => {
    const tree = questTreeFromStructure(structure);
    expect(tree.initialNodeId).toBe("shore");
    expect(tree.nodes.map((node) => node.id)).toEqual(["shore", "stairs", "cave", "vault", "ending", "orphan"]);
    expect(tree.edges.map((edge) => edge.inputId)).toEqual(["descend", "enter", "push", "crawl", "leave"]);
  });

  it("claims no lock and no explanation, since availability is unknown", () => {
    const tree = questTreeFromStructure(structure);
    expect(tree.edges.every((edge) => edge.isAvailable)).toBe(true);
    expect(tree.edges.every((edge) => edge.evaluation === undefined)).toBe(true);
  });
});

describe("buildQuestGraph on a stateless structure", () => {
  it("marks the mastery union as discoveredBefore and everything else as unseen", () => {
    const graph = buildQuestGraph({
      tree: questTreeFromStructure(structure),
      masteryNodeIds: ["shore", "cave", "vault"],
    });
    expect(Object.fromEntries(graph.nodes.map((node) => [node.id, node.state]))).toEqual({
      shore: "discoveredBefore", stairs: "unseen", cave: "discoveredBefore",
      vault: "discoveredBefore", ending: "unseen", orphan: "unseen",
    });
  });

  it("never produces current, takenThisRun or locked outside a run", () => {
    const graph = buildQuestGraph({ tree: questTreeFromStructure(structure), masteryNodeIds: structure.nodes.map((node) => node.id) });
    const summary = summariseQuestGraph(graph);
    expect(summary).toMatchObject({ current: 0, takenThisRun: 0, locked: 0, unseen: 0, discoveredBefore: 6, discoveryPercent: 100 });
  });

  it("leaves every node unseen without any mastery", () => {
    const graph = buildQuestGraph({ tree: questTreeFromStructure(structure) });
    expect(graph.nodes.every((node) => node.state === "unseen")).toBe(true);
    expect(summariseQuestGraph(graph)).toMatchObject({ known: 0, discoveryPercent: 0, endings: 1, knownEndings: 0 });
  });

  it("ignores mastery identifiers absent from the structure", () => {
    const graph = buildQuestGraph({ tree: questTreeFromStructure(structure), masteryNodeIds: ["ghost"] });
    expect(graph.nodes.map((node) => node.id)).not.toContain("ghost");
    expect(summariseQuestGraph(graph).known).toBe(0);
  });

  it("marks a passage as discoveredBefore only when both ends are known", () => {
    const graph = buildQuestGraph({
      tree: questTreeFromStructure(structure),
      masteryNodeIds: ["shore", "stairs"],
      masteryChoiceIds: ["descend"],
    });
    const states = Object.fromEntries(graph.edges.map((edge) => [edge.inputId, edge.state]));
    expect(states).toEqual({ descend: "discoveredBefore", enter: "unavailable", push: "unavailable", crawl: "unavailable", leave: "unavailable" });
    expect(graph.edges.find((edge) => edge.inputId === "descend")?.isRecordedChoice).toBe(true);
    expect(graph.edges.find((edge) => edge.inputId === "enter")?.isRecordedChoice).toBe(false);
  });
});

describe("layout parity between the in-run tree and the stateless structure", () => {
  const outOfRun = buildQuestGraph({ tree: questTreeFromStructure(structure) });
  const inRun = buildQuestGraph({ tree: inRunTree() });

  it("places every node on the same rank and the same coordinates", () => {
    expect(outOfRun.nodes.map(({ id, rank, x, y }) => ({ id, rank, x, y })))
      .toEqual(inRun.nodes.map(({ id, rank, x, y }) => ({ id, rank, x, y })));
  });

  it("produces identical bounds", () => {
    expect(outOfRun.bounds).toEqual(inRun.bounds);
  });

  it("keeps the same passages in the same order", () => {
    expect(outOfRun.edges.map((edge) => `${edge.sourceNodeId}->${edge.targetNodeId}`))
      .toEqual(inRun.edges.map((edge) => `${edge.sourceNodeId}->${edge.targetNodeId}`));
  });

  it("ranks the unreachable node after the reachable ones", () => {
    const ranks = Object.fromEntries(outOfRun.nodes.map((node) => [node.id, node.rank]));
    expect(ranks).toEqual({ shore: 0, stairs: 1, cave: 1, vault: 2, ending: 3, orphan: 4 });
  });
});
