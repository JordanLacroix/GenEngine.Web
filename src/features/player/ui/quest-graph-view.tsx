"use client";

import { useId, useMemo } from "react";
import {
  buildQuestGraph, summariseQuestGraph,
  type QuestEdgeState, type QuestGraph, type QuestGraphNode, type QuestNodeState, type QuestTreeInput,
} from "@/features/player/model/quest-graph";

const stepX = 168;
const stepY = 78;
const nodeWidth = 124;
const nodeHeight = 46;
const padding = 34;
/** Above this size the diagram stops being readable: the textual list takes over. */
const maxRenderedNodes = 60;

const nodeStateLabels: Record<QuestNodeState, string> = {
  current: "Étape actuelle",
  takenThisRun: "Parcouru dans cette partie",
  discoveredBefore: "Découvert lors d’une partie précédente",
  locked: "Verrouillé",
  unseen: "Jamais atteint",
};

const edgeStateLabels: Record<QuestEdgeState, string> = {
  takenThisRun: "Emprunté dans cette partie",
  discoveredBefore: "Déjà exploré",
  unavailable: "Non exploré",
};

const legend: QuestNodeState[] = ["current", "takenThisRun", "discoveredBefore", "locked", "unseen"];

export interface QuestGraphViewProps {
  tree: QuestTreeInput;
  masteryNodeIds?: readonly string[];
  masteryChoiceIds?: readonly string[];
  /** Short French sentence displayed above the diagram. */
  caption?: string;
  emptyMessage?: string;
}

export function QuestGraphView({ tree, masteryNodeIds = [], masteryChoiceIds = [], caption, emptyMessage }: QuestGraphViewProps) {
  const graph = useMemo(
    () => buildQuestGraph({ tree, masteryNodeIds, masteryChoiceIds }),
    [tree, masteryNodeIds, masteryChoiceIds],
  );
  const summary = useMemo(() => summariseQuestGraph(graph), [graph]);
  const titleId = useId();
  const descriptionId = useId();

  if (graph.nodes.length === 0) {
    return <section className="quest-graph quest-graph--empty"><p>{emptyMessage ?? "La structure de ce récit n’est pas encore disponible."}</p></section>;
  }

  const description = `Graphe du récit : ${summary.total} étape${plural(summary.total)}, ${summary.known} connue${plural(summary.known)} soit ${summary.discoveryPercent} % de découverte, ${summary.takenThisRun + summary.current} parcourue${plural(summary.takenThisRun + summary.current)} dans cette partie, ${summary.discoveredBefore} retenue${plural(summary.discoveredBefore)} des parties précédentes, ${summary.locked} verrouillée${plural(summary.locked)}, ${summary.unseen} jamais atteinte${plural(summary.unseen)}. ${summary.knownEndings} fin${plural(summary.knownEndings)} sur ${summary.endings} découverte${plural(summary.knownEndings)}.`;
  const oversized = graph.nodes.length > maxRenderedNodes;

  return (
    <section className="quest-graph" aria-labelledby={titleId}>
      <header className="quest-graph-heading">
        <div>
          <p className="eyebrow">Mémoire du récit</p>
          <h3 id={titleId}>Le récit complet, et ce que vous en connaissez</h3>
          {caption && <p className="quest-graph-caption">{caption}</p>}
        </div>
        <p className="quest-graph-score"><b>{summary.discoveryPercent}%</b><small>{summary.known} / {summary.total} étapes connues</small></p>
      </header>

      {oversized
        ? <p className="quest-graph-notice" role="status">Ce récit compte {graph.nodes.length} étapes : le schéma serait illisible. La liste ci-dessous reste complète.</p>
        : <QuestGraphDiagram graph={graph} titleId={`${titleId}-svg`} descriptionId={descriptionId} description={description} />}

      <ul className="quest-graph-legend">
        {legend.map((state) => (
          <li key={state} data-state={state}><span aria-hidden="true" />{nodeStateLabels[state]}</li>
        ))}
      </ul>

      <details className="quest-graph-list">
        <summary>Détail des étapes ({graph.nodes.length})</summary>
        <ol>
          {graph.nodes.map((node) => (
            <li key={node.id} data-state={node.state}>
              <strong>{node.id}{node.isEnding ? " · fin" : ""}</strong>
              <small>{nodeStateLabels[node.state]}</small>
              <p>{node.text}</p>
            </li>
          ))}
        </ol>
        <h4>Passages</h4>
        <ul className="quest-graph-edges">
          {graph.edges.map((edge) => (
            <li key={`${edge.sourceNodeId}-${edge.inputId}-${edge.targetNodeId}`} data-state={edge.state}>
              <strong>{edge.sourceNodeId} → {edge.targetNodeId}</strong>
              <small>{edgeStateLabels[edge.state]}{edge.isAvailable ? "" : " · verrouillé"}{edge.isRecordedChoice ? " · choix déjà fait" : ""}</small>
              <p>{edge.text}</p>
              {!edge.isAvailable && edge.explanation && <p className="quest-graph-explanation">{edge.explanation}</p>}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function QuestGraphDiagram({ graph, titleId, descriptionId, description }: { graph: QuestGraph; titleId: string; descriptionId: string; description: string }) {
  const width = (graph.bounds.width + 1) * stepX + padding * 2;
  const height = (graph.bounds.height + 1) * stepY + padding * 2;
  const positions = new Map(graph.nodes.map((node) => [node.id, screenPosition(node, graph)] as const));

  return (
    <div className="quest-graph-canvas" tabIndex={0} role="group" aria-label="Schéma du récit, défilement possible">
      <svg role="img" aria-labelledby={`${titleId} ${descriptionId}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="xMidYMid meet">
        <title id={titleId}>Graphe du récit et mémoire de vos parcours</title>
        <desc id={descriptionId}>{description}</desc>
        <defs>
          {(Object.keys(edgeStateLabels) as QuestEdgeState[]).map((state) => (
            <marker key={state} id={`${titleId}-arrow-${state}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" className={`quest-edge-head quest-edge-head--${state}`} />
            </marker>
          ))}
        </defs>
        <g className="quest-graph-edges-layer">
          {graph.edges.map((edge) => {
            const from = positions.get(edge.sourceNodeId)!;
            const to = positions.get(edge.targetNodeId)!;
            return <path
              key={`${edge.sourceNodeId}-${edge.inputId}-${edge.targetNodeId}`}
              className={`quest-edge quest-edge--${edge.state}`}
              markerEnd={`url(#${titleId}-arrow-${edge.state})`}
              d={edgePath(from, to)}
            />;
          })}
        </g>
        <g className="quest-graph-nodes-layer">
          {graph.nodes.map((node) => {
            const position = positions.get(node.id)!;
            return (
              <g key={node.id} className={`quest-node quest-node--${node.state} ${node.isEnding ? "quest-node--ending" : ""}`}>
                <rect
                  x={position.x - nodeWidth / 2} y={position.y - nodeHeight / 2}
                  width={nodeWidth} height={nodeHeight} rx={node.isEnding ? nodeHeight / 2 : 10}
                />
                <text x={position.x} y={position.y + 4} textAnchor="middle">{truncate(node.id)}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function screenPosition(node: QuestGraphNode, graph: QuestGraph) {
  return {
    x: padding + (node.x - graph.bounds.minX) * stepX + nodeWidth / 2,
    y: padding + (node.y - graph.bounds.minY) * stepY + nodeHeight / 2,
  };
}

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const start = { x: from.x + nodeWidth / 2, y: from.y };
  const end = { x: to.x - nodeWidth / 2, y: to.y };
  if (to.x <= from.x) {
    // Merge or loop back: arc under the ranks instead of crossing the nodes.
    const drop = Math.max(from.y, to.y) + nodeHeight;
    return `M${start.x - nodeWidth / 2},${from.y + nodeHeight / 2} C${from.x},${drop} ${to.x},${drop} ${to.x},${to.y + nodeHeight / 2}`;
  }
  const midpoint = (start.x + end.x) / 2;
  return `M${start.x},${start.y} C${midpoint},${start.y} ${midpoint},${end.y} ${end.x},${end.y}`;
}

function truncate(value: string) { return value.length > 15 ? `${value.slice(0, 14)}…` : value; }
function plural(count: number) { return count > 1 ? "s" : ""; }
