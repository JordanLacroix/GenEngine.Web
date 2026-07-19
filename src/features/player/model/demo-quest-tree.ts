import type { DemoStory } from "@/entities/story/model/story";
import type { QuestTreeInput } from "./quest-graph";

/**
 * Projects the offline demonstration fixture onto the same shape as the
 * `NarrativeTreeContract` returned by Play, so one single component renders the
 * quest graph in both modes. This is an adapter for the demo only: it never
 * substitutes a failed production request.
 */
export function demoQuestTree(story: DemoStory, currentSceneId: string, history: readonly string[]): QuestTreeInput {
  const visited = new Set(history);
  return {
    initialNodeId: story.openingSceneId,
    currentNodeId: currentSceneId,
    nodes: story.scenes.map((scene) => ({
      id: scene.id,
      text: scene.title,
      isEnding: scene.choices.length === 0,
      state: scene.id === currentSceneId ? "Current" : visited.has(scene.id) ? "Visited" : "Unexplored",
    })),
    edges: story.scenes.flatMap((scene) => scene.choices.map((choice) => ({
      sourceNodeId: scene.id,
      targetNodeId: choice.nextSceneId,
      inputId: choice.id,
      text: choice.label,
      isAvailable: true,
      evaluation: { explanation: `Choix « ${choice.label} » — tonalité ${choice.tone}.` },
    }))),
  };
}

const memoryKey = "genengine.demo.memory";

export interface DemoQuestMemory { nodeIds: string[]; choiceIds: string[] }

/** Cumulative demo memory, kept locally because the demo has no backend. */
export function readDemoQuestMemory(): DemoQuestMemory {
  if (typeof window === "undefined") return { nodeIds: [], choiceIds: [] };
  try {
    const raw = window.localStorage.getItem(memoryKey);
    if (!raw) return { nodeIds: [], choiceIds: [] };
    const parsed = JSON.parse(raw) as Partial<DemoQuestMemory>;
    return { nodeIds: stringList(parsed.nodeIds), choiceIds: stringList(parsed.choiceIds) };
  } catch { return { nodeIds: [], choiceIds: [] }; }
}

export function rememberDemoQuestSteps(current: DemoQuestMemory, nodeIds: readonly string[], choiceIds: readonly string[]): DemoQuestMemory {
  const merged: DemoQuestMemory = {
    nodeIds: [...new Set([...current.nodeIds, ...nodeIds])],
    choiceIds: [...new Set([...current.choiceIds, ...choiceIds])],
  };
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(memoryKey, JSON.stringify(merged)); } catch { /* storage unavailable: the run still displays. */ }
  }
  return merged;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
