/**
 * Pure presentation derivation for the quest graph.
 *
 * The backend stays authoritative: node availability, lock reasons and reachability
 * all come from the payload. This module only projects that payload onto a
 * deterministic layered layout and a display state per node and per edge.
 *
 * No React, no DOM, no runtime dependency.
 */

export type QuestNodeState = "current" | "takenThisRun" | "discoveredBefore" | "locked" | "unseen";
export type QuestEdgeState = "takenThisRun" | "discoveredBefore" | "unavailable";

export interface QuestTreeNodeInput {
  id: string;
  text: string;
  isEnding: boolean;
  state: "Current" | "Visited" | "Unexplored" | "Locked";
}

export interface QuestTreeEdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
  inputId: string;
  text: string;
  isAvailable: boolean;
  evaluation?: { explanation?: string };
}

export interface QuestTreeInput {
  initialNodeId: string;
  /** Absent outside a run: without a session no node is the current one. */
  currentNodeId?: string;
  nodes: readonly QuestTreeNodeInput[];
  edges: readonly QuestTreeEdgeInput[];
}

/** Node of a published version topology, without any world state. */
export interface QuestStructureNodeInput {
  id: string;
  text: string;
  isEnding: boolean;
}

/** Passage of a published version topology, without any condition evaluation. */
export interface QuestStructureEdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
  inputId: string;
  text: string;
}

/** Mirrors `ScenarioStructureContract`: topology only, no state, no evaluation. */
export interface QuestStructureInput {
  initialNodeId: string;
  nodes: readonly QuestStructureNodeInput[];
  edges: readonly QuestStructureEdgeInput[];
}

/**
 * Adapts a stateless published structure onto the builder's input shape, so a
 * single layout and a single derivation serve both the in-run and the out-of-run
 * views.
 *
 * Outside a session there is no world state, therefore:
 * - no node is `Current` and none is `Visited` — only the cumulative mastery can
 *   mark a node as discovered, everything else stays unseen;
 * - no node is `Locked`: availability is unknown, and the client never guesses
 *   it. Passages are reported as not-known-to-be-locked and carry no
 *   explanation, so the view claims nothing the backend did not say.
 *
 * The node array order and the edge set are preserved, which keeps the BFS ranks,
 * the in-rank ordering and the resulting coordinates identical to the in-run
 * graph of the same topology.
 */
export function questTreeFromStructure(structure: QuestStructureInput): QuestTreeInput {
  return {
    initialNodeId: structure.initialNodeId,
    nodes: structure.nodes.map((node) => ({ id: node.id, text: node.text, isEnding: node.isEnding, state: "Unexplored" })),
    edges: structure.edges.map((edge) => ({
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      inputId: edge.inputId,
      text: edge.text,
      isAvailable: true,
    })),
  };
}

export interface QuestGraphInput {
  tree: QuestTreeInput;
  masteryNodeIds?: readonly string[];
  masteryChoiceIds?: readonly string[];
}

export interface QuestGraphNode {
  id: string;
  text: string;
  isEnding: boolean;
  state: QuestNodeState;
  rank: number;
  x: number;
  y: number;
}

export interface QuestGraphEdge {
  sourceNodeId: string;
  targetNodeId: string;
  inputId: string;
  text: string;
  state: QuestEdgeState;
  isAvailable: boolean;
  explanation: string;
  /** The choice was recorded in the cumulative mastery of the scenario version. */
  isRecordedChoice: boolean;
}

export interface QuestGraphBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  rankCount: number;
  maxNodesPerRank: number;
}

export interface QuestGraph {
  nodes: QuestGraphNode[];
  edges: QuestGraphEdge[];
  bounds: QuestGraphBounds;
}

const emptyBounds: QuestGraphBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, rankCount: 0, maxNodesPerRank: 0 };

/**
 * Builds the displayable graph. The result is stable for a given input:
 * same order in, same coordinates out.
 */
export function buildQuestGraph({ tree, masteryNodeIds = [], masteryChoiceIds = [] }: QuestGraphInput): QuestGraph {
  const sourceNodes = dedupeNodes(tree?.nodes ?? []);
  if (sourceNodes.length === 0) return { nodes: [], edges: [], bounds: emptyBounds };

  const knownIds = new Set(sourceNodes.map((node) => node.id));
  const edges = (tree?.edges ?? []).filter((edge) => knownIds.has(edge.sourceNodeId) && knownIds.has(edge.targetNodeId));
  const mastered = new Set(masteryNodeIds);
  const masteredChoices = new Set(masteryChoiceIds);

  const ranks = computeRanks(sourceNodes, edges, tree.initialNodeId);
  const positions = layout(sourceNodes, ranks);

  const nodes: QuestGraphNode[] = sourceNodes.map((node) => {
    const position = positions.get(node.id)!;
    return {
      id: node.id,
      text: node.text,
      isEnding: node.isEnding,
      state: nodeState(node, tree.currentNodeId, mastered),
      rank: position.rank,
      x: position.x,
      y: position.y,
    };
  });

  const stateById = new Map(nodes.map((node) => [node.id, node.state] as const));
  const graphEdges: QuestGraphEdge[] = edges.map((edge) => {
    const source = stateById.get(edge.sourceNodeId)!;
    const target = stateById.get(edge.targetNodeId)!;
    return {
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      inputId: edge.inputId,
      text: edge.text,
      state: edgeState(source, target),
      isAvailable: Boolean(edge.isAvailable),
      explanation: edge.evaluation?.explanation ?? "",
      isRecordedChoice: masteredChoices.has(edge.inputId),
    };
  });

  return { nodes, edges: graphEdges, bounds: boundsOf(nodes) };
}

/** Precedence: current > takenThisRun > discoveredBefore > locked > unseen. */
function nodeState(node: QuestTreeNodeInput, currentNodeId: string | undefined, mastered: ReadonlySet<string>): QuestNodeState {
  if (currentNodeId !== undefined && node.id === currentNodeId) return "current";
  if (node.state === "Visited") return "takenThisRun";
  if (mastered.has(node.id)) return "discoveredBefore";
  if (node.state === "Locked") return "locked";
  return "unseen";
}

function edgeState(source: QuestNodeState, target: QuestNodeState): QuestEdgeState {
  if (isTaken(source) && isTaken(target)) return "takenThisRun";
  if (isKnown(source) && isKnown(target)) return "discoveredBefore";
  return "unavailable";
}

function isTaken(state: QuestNodeState) { return state === "current" || state === "takenThisRun"; }
function isKnown(state: QuestNodeState) { return isTaken(state) || state === "discoveredBefore"; }

/**
 * Shortest distance from the initial node, following edge direction.
 * The structure is a directed graph with merges and possible cycles: every node
 * is kept exactly once. Nodes the initial node cannot reach land on `maxRank + 1`.
 */
function computeRanks(nodes: readonly QuestTreeNodeInput[], edges: readonly QuestTreeEdgeInput[], initialNodeId: string): Map<string, number> {
  const successors = new Map<string, string[]>();
  for (const edge of edges) {
    const list = successors.get(edge.sourceNodeId);
    if (list) list.push(edge.targetNodeId);
    else successors.set(edge.sourceNodeId, [edge.targetNodeId]);
  }

  const ranks = new Map<string, number>();
  const start = nodes.some((node) => node.id === initialNodeId) ? initialNodeId : undefined;
  let maxRank = -1;
  if (start !== undefined) {
    ranks.set(start, 0);
    let frontier = [start];
    let distance = 0;
    maxRank = 0;
    while (frontier.length > 0) {
      const next: string[] = [];
      distance += 1;
      for (const id of frontier) {
        for (const target of successors.get(id) ?? []) {
          if (ranks.has(target)) continue;
          ranks.set(target, distance);
          maxRank = distance;
          next.push(target);
        }
      }
      frontier = next;
    }
  }

  const orphanRank = maxRank + 1;
  for (const node of nodes) if (!ranks.has(node.id)) ranks.set(node.id, orphanRank);
  return ranks;
}

/** x = rank, y = centred index inside the rank. Unitless: the view scales them. */
function layout(nodes: readonly QuestTreeNodeInput[], ranks: ReadonlyMap<string, number>) {
  const byRank = new Map<number, QuestTreeNodeInput[]>();
  for (const node of nodes) {
    const rank = ranks.get(node.id)!;
    const list = byRank.get(rank);
    if (list) list.push(node);
    else byRank.set(rank, [node]);
  }

  const positions = new Map<string, { rank: number; x: number; y: number }>();
  for (const [rank, group] of byRank) {
    const offset = (group.length - 1) / 2;
    group.forEach((node, index) => positions.set(node.id, { rank, x: rank, y: index - offset }));
  }
  return positions;
}

function boundsOf(nodes: readonly QuestGraphNode[]): QuestGraphBounds {
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const perRank = new Map<number, number>();
  for (const node of nodes) perRank.set(node.rank, (perRank.get(node.rank) ?? 0) + 1);
  return {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY,
    rankCount: perRank.size,
    maxNodesPerRank: Math.max(...perRank.values()),
  };
}

function dedupeNodes(nodes: readonly QuestTreeNodeInput[]): QuestTreeNodeInput[] {
  const seen = new Set<string>();
  const unique: QuestTreeNodeInput[] = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    unique.push(node);
  }
  return unique;
}

/** Counts used by the summaries and the accessible description. */
export function summariseQuestGraph(graph: QuestGraph) {
  const counts = { current: 0, takenThisRun: 0, discoveredBefore: 0, locked: 0, unseen: 0 } satisfies Record<QuestNodeState, number>;
  for (const node of graph.nodes) counts[node.state] += 1;
  const known = counts.current + counts.takenThisRun + counts.discoveredBefore;
  return {
    ...counts,
    total: graph.nodes.length,
    known,
    endings: graph.nodes.filter((node) => node.isEnding).length,
    knownEndings: graph.nodes.filter((node) => node.isEnding && node.state !== "unseen" && node.state !== "locked").length,
    discoveryPercent: graph.nodes.length === 0 ? 0 : Math.round((known / graph.nodes.length) * 100),
  };
}
