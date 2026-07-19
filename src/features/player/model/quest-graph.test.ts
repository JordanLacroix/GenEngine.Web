import { describe, expect, it } from "vitest";
import { buildQuestGraph, summariseQuestGraph, type QuestTreeEdgeInput, type QuestTreeInput, type QuestTreeNodeInput } from "./quest-graph";

function node(id: string, state: QuestTreeNodeInput["state"], isEnding = false): QuestTreeNodeInput {
  return { id, text: `Texte ${id}`, isEnding, state };
}

function edge(sourceNodeId: string, targetNodeId: string, isAvailable = true, explanation = ""): QuestTreeEdgeInput {
  return { sourceNodeId, targetNodeId, inputId: `${sourceNodeId}->${targetNodeId}`, text: `Aller en ${targetNodeId}`, isAvailable, evaluation: { explanation } };
}

function tree(partial: Partial<QuestTreeInput>): QuestTreeInput {
  return { initialNodeId: "a", currentNodeId: "a", nodes: [], edges: [], ...partial };
}

describe("buildQuestGraph node states", () => {
  const base = tree({
    initialNodeId: "a",
    currentNodeId: "c",
    nodes: [node("a", "Visited"), node("b", "Unexplored"), node("c", "Current"), node("d", "Locked"), node("e", "Unexplored")],
    edges: [edge("a", "b"), edge("a", "c"), edge("c", "d"), edge("c", "e")],
  });

  it("applies the documented precedence", () => {
    const graph = buildQuestGraph({ tree: base, masteryNodeIds: ["a", "b", "c", "d"] });
    const states = Object.fromEntries(graph.nodes.map((item) => [item.id, item.state]));
    expect(states).toEqual({ a: "takenThisRun", b: "discoveredBefore", c: "current", d: "discoveredBefore", e: "unseen" });
  });

  it("prefers current over every other signal", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "a", nodes: [node("a", "Visited")] }), masteryNodeIds: ["a"] });
    expect(graph.nodes[0]!.state).toBe("current");
  });

  it("prefers the current run over the cumulative memory", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "z", nodes: [node("a", "Visited")] }), masteryNodeIds: ["a"] });
    expect(graph.nodes[0]!.state).toBe("takenThisRun");
  });

  it("keeps locked nodes locked when the memory does not know them", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "z", nodes: [node("a", "Locked")] }) });
    expect(graph.nodes[0]!.state).toBe("locked");
  });

  it("promotes a locked node the player already discovered in a past run", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "z", nodes: [node("a", "Locked")] }), masteryNodeIds: ["a"] });
    expect(graph.nodes[0]!.state).toBe("discoveredBefore");
  });

  it("falls back to unseen", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "z", nodes: [node("a", "Unexplored")] }) });
    expect(graph.nodes[0]!.state).toBe("unseen");
  });

  it("builds the cumulative union across every past playthrough", () => {
    const firstRun = ["a", "b"];
    const secondRun = ["a", "c"];
    const graph = buildQuestGraph({
      tree: tree({ currentNodeId: "z", nodes: [node("a", "Unexplored"), node("b", "Unexplored"), node("c", "Unexplored"), node("d", "Unexplored")] }),
      masteryNodeIds: [...firstRun, ...secondRun],
    });
    expect(graph.nodes.map((item) => item.state)).toEqual(["discoveredBefore", "discoveredBefore", "discoveredBefore", "unseen"]);
  });
});

describe("buildQuestGraph edge states", () => {
  it("marks an edge taken this run when both endpoints belong to the run", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "b", nodes: [node("a", "Visited"), node("b", "Current")], edges: [edge("a", "b")] }) });
    expect(graph.edges[0]!.state).toBe("takenThisRun");
  });

  it("marks an edge discovered before when both endpoints are known but not both taken", () => {
    const graph = buildQuestGraph({
      tree: tree({ currentNodeId: "a", nodes: [node("a", "Current"), node("b", "Unexplored")], edges: [edge("a", "b")] }),
      masteryNodeIds: ["b"],
    });
    expect(graph.edges[0]!.state).toBe("discoveredBefore");
  });

  it("marks an edge unavailable when an endpoint is unknown", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "a", nodes: [node("a", "Current"), node("b", "Locked")], edges: [edge("a", "b", false, "Il vous manque la clé.")] }) });
    expect(graph.edges[0]).toMatchObject({ state: "unavailable", isAvailable: false, explanation: "Il vous manque la clé." });
  });

  it("exposes an empty explanation when the payload carries none", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "a", nodes: [node("a", "Current"), node("b", "Unexplored")], edges: [{ sourceNodeId: "a", targetNodeId: "b", inputId: "i", text: "t", isAvailable: true }] }) });
    expect(graph.edges[0]!.explanation).toBe("");
  });

  it("flags the choices recorded in the cumulative memory", () => {
    const graph = buildQuestGraph({
      tree: tree({ currentNodeId: "a", nodes: [node("a", "Current"), node("b", "Unexplored")], edges: [edge("a", "b")] }),
      masteryChoiceIds: ["a->b"],
    });
    expect(graph.edges[0]!.isRecordedChoice).toBe(true);
  });

  it("drops edges pointing outside the node set instead of inventing nodes", () => {
    const graph = buildQuestGraph({ tree: tree({ currentNodeId: "a", nodes: [node("a", "Current")], edges: [edge("a", "ghost")] }) });
    expect(graph.edges).toHaveLength(0);
    expect(graph.nodes).toHaveLength(1);
  });
});

describe("buildQuestGraph layout", () => {
  it("ranks a converging graph by shortest distance and never duplicates a merge node", () => {
    const graph = buildQuestGraph({
      tree: tree({
        initialNodeId: "start",
        currentNodeId: "start",
        nodes: [node("start", "Current"), node("left", "Unexplored"), node("right", "Unexplored"), node("merge", "Unexplored"), node("end", "Unexplored", true)],
        edges: [edge("start", "left"), edge("start", "right"), edge("left", "merge"), edge("right", "merge"), edge("merge", "end")],
      }),
    });
    expect(Object.fromEntries(graph.nodes.map((item) => [item.id, item.rank]))).toEqual({ start: 0, left: 1, right: 1, merge: 2, end: 3 });
    expect(graph.nodes.filter((item) => item.id === "merge")).toHaveLength(1);
  });

  it("takes the shortest path when a shortcut skips a rank", () => {
    const graph = buildQuestGraph({
      tree: tree({
        initialNodeId: "a",
        nodes: [node("a", "Current"), node("b", "Unexplored"), node("c", "Unexplored")],
        edges: [edge("a", "b"), edge("b", "c"), edge("a", "c")],
      }),
    });
    expect(graph.nodes.find((item) => item.id === "c")!.rank).toBe(1);
  });

  it("terminates on a cycle and keeps every node once", () => {
    const graph = buildQuestGraph({
      tree: tree({
        initialNodeId: "a",
        nodes: [node("a", "Current"), node("b", "Unexplored"), node("c", "Unexplored")],
        edges: [edge("a", "b"), edge("b", "c"), edge("c", "a"), edge("c", "b")],
      }),
    });
    expect(graph.nodes.map((item) => item.rank)).toEqual([0, 1, 2]);
  });

  it("centres the nodes of a rank and keeps the incoming order stable", () => {
    const graph = buildQuestGraph({
      tree: tree({
        initialNodeId: "a",
        nodes: [node("a", "Current"), node("b", "Unexplored"), node("c", "Unexplored"), node("d", "Unexplored")],
        edges: [edge("a", "b"), edge("a", "c"), edge("a", "d")],
      }),
    });
    expect(graph.nodes.map((item) => ({ id: item.id, x: item.x, y: item.y }))).toEqual([
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 1, y: -1 },
      { id: "c", x: 1, y: 0 },
      { id: "d", x: 1, y: 1 },
    ]);
  });

  it("orders a rank by the incoming node order, not by edge order", () => {
    const nodes = [node("a", "Current"), node("b", "Unexplored"), node("c", "Unexplored")];
    const straight = buildQuestGraph({ tree: tree({ initialNodeId: "a", nodes, edges: [edge("a", "b"), edge("a", "c")] }) });
    const reversed = buildQuestGraph({ tree: tree({ initialNodeId: "a", nodes, edges: [edge("a", "c"), edge("a", "b")] }) });
    expect(straight.nodes.map((item) => item.y)).toEqual(reversed.nodes.map((item) => item.y));
    expect(straight.nodes.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("pushes unreachable nodes onto the rank after the last reachable one", () => {
    const graph = buildQuestGraph({
      tree: tree({
        initialNodeId: "a",
        nodes: [node("a", "Current"), node("b", "Unexplored"), node("orphan", "Unexplored")],
        edges: [edge("a", "b")],
      }),
    });
    expect(graph.nodes.find((item) => item.id === "orphan")!.rank).toBe(2);
  });

  it("puts every node on rank zero when the initial node is missing", () => {
    const graph = buildQuestGraph({ tree: tree({ initialNodeId: "absent", nodes: [node("a", "Unexplored"), node("b", "Unexplored")], edges: [edge("a", "b")] }) });
    expect(graph.nodes.map((item) => item.rank)).toEqual([0, 0]);
  });

  it("reports bounds covering every node", () => {
    const graph = buildQuestGraph({
      tree: tree({ initialNodeId: "a", nodes: [node("a", "Current"), node("b", "Unexplored"), node("c", "Unexplored")], edges: [edge("a", "b"), edge("a", "c")] }),
    });
    expect(graph.bounds).toEqual({ minX: 0, maxX: 1, minY: -0.5, maxY: 0.5, width: 1, height: 1, rankCount: 2, maxNodesPerRank: 2 });
  });
});

describe("buildQuestGraph degenerate input", () => {
  it("returns an empty graph without nodes", () => {
    const graph = buildQuestGraph({ tree: tree({}) });
    expect(graph).toEqual({ nodes: [], edges: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, rankCount: 0, maxNodesPerRank: 0 } });
  });

  it("handles a single node without edges", () => {
    const graph = buildQuestGraph({ tree: tree({ initialNodeId: "a", currentNodeId: "a", nodes: [node("a", "Current", true)] }) });
    expect(graph.nodes).toEqual([{ id: "a", text: "Texte a", isEnding: true, state: "current", rank: 0, x: 0, y: 0 }]);
    expect(graph.bounds.maxNodesPerRank).toBe(1);
  });

  it("keeps a duplicated node identifier only once", () => {
    const graph = buildQuestGraph({ tree: tree({ initialNodeId: "a", nodes: [node("a", "Current"), node("a", "Unexplored")] }) });
    expect(graph.nodes).toHaveLength(1);
  });
});

describe("summariseQuestGraph", () => {
  it("counts the states, the endings and the discovery ratio", () => {
    const graph = buildQuestGraph({
      tree: tree({
        initialNodeId: "a",
        currentNodeId: "b",
        nodes: [node("a", "Visited"), node("b", "Current"), node("c", "Unexplored"), node("d", "Unexplored", true), node("e", "Locked", true)],
        edges: [edge("a", "b"), edge("b", "c"), edge("b", "d"), edge("b", "e")],
      }),
      masteryNodeIds: ["d"],
    });
    expect(summariseQuestGraph(graph)).toMatchObject({
      current: 1, takenThisRun: 1, discoveredBefore: 1, locked: 1, unseen: 1,
      total: 5, known: 3, endings: 2, knownEndings: 1, discoveryPercent: 60,
    });
  });

  it("reports zero on an empty graph", () => {
    expect(summariseQuestGraph({ nodes: [], edges: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, rankCount: 0, maxNodesPerRank: 0 } }).discoveryPercent).toBe(0);
  });
});
