/**
 * Lecture et écriture du brouillon narratif manipulé par le Studio.
 *
 * Le document reste la propriété du moteur : le Studio ne valide pas les règles
 * narratives, il conserve tout champ inconnu tel quel et ne réécrit que ce que
 * l'opérateur modifie. Les champs média (`visualUrl`, `visualDescription`,
 * `soundUrl`, `animationCue`) proviennent de la tranche moteur correspondante ;
 * un document qui ne les porte pas reste valide et l'interface le dit.
 */

export interface DraftChoice {
  id: string;
  text: string;
  targetNodeId: string;
  soundUrl?: string;
  animationCue?: string;
  [key: string]: unknown;
}

export interface DraftNode {
  id: string;
  text: string;
  isEnding?: boolean;
  choices: DraftChoice[];
  visualUrl?: string;
  visualDescription?: string;
  soundUrl?: string;
  [key: string]: unknown;
}

export interface NarrativeDraft {
  schemaVersion: number;
  title: string;
  initialNodeId: string;
  nodes: DraftNode[];
  [key: string]: unknown;
}

export const emptyDraft: NarrativeDraft = { schemaVersion: 2, title: "", initialNodeId: "", nodes: [] };

/**
 * Repères d'animation connus du client. Un repère hors de cette liste reste
 * accepté — le moteur est autoritaire — mais l'aperçu annonce qu'il ne sait pas
 * le jouer plutôt que d'afficher une animation arbitraire.
 */
export const knownAnimationCues = [
  { id: "pulse", label: "Pulsation", description: "Le choix respire une fois, pour marquer une décision douce." },
  { id: "shake", label: "Secousse", description: "Une oscillation courte, pour un choix risqué ou refusé." },
  { id: "glow", label: "Halo", description: "Un halo doré, pour une révélation ou une récompense." },
  { id: "rise", label: "Élan", description: "Le choix s'élève, pour une ouverture ou un départ." },
  { id: "fade", label: "Effacement", description: "Le choix s'estompe, pour une renonciation." },
] as const;

export function isKnownAnimationCue(cue: string | undefined): boolean {
  return Boolean(cue) && knownAnimationCues.some((entry) => entry.id === cue);
}

/** Lecture tolérante d'un brouillon : un JSON illisible donne un brouillon vide. */
export function narrativeDraft(value: string): NarrativeDraft {
  try {
    const parsed = JSON.parse(value) as Partial<NarrativeDraft>;
    if (typeof parsed !== "object" || parsed === null) return emptyDraft;
    return {
      ...parsed,
      schemaVersion: parsed.schemaVersion ?? 2,
      title: parsed.title ?? "",
      initialNodeId: parsed.initialNodeId ?? "",
      nodes: Array.isArray(parsed.nodes)
        ? parsed.nodes.map((node) => ({
          ...node,
          id: node.id ?? "",
          text: node.text ?? "",
          choices: Array.isArray(node.choices) ? node.choices : [],
        }))
        : [],
    };
  } catch {
    return emptyDraft;
  }
}

export function serializeDraft(draft: NarrativeDraft): string {
  return JSON.stringify(draft, null, 2);
}

export function updateNode(draft: NarrativeDraft, nodeId: string, patch: Partial<DraftNode>): NarrativeDraft {
  return { ...draft, nodes: draft.nodes.map((node) => node.id === nodeId ? prune({ ...node, ...patch }) : node) };
}

export function updateChoice(
  draft: NarrativeDraft,
  nodeId: string,
  choiceIndex: number,
  patch: Partial<DraftChoice>,
): NarrativeDraft {
  return {
    ...draft,
    nodes: draft.nodes.map((node) => node.id === nodeId
      ? { ...node, choices: node.choices.map((choice, index) => index === choiceIndex ? prune({ ...choice, ...patch }) : choice) }
      : node),
  };
}

/** Une valeur vidée par l'opérateur disparaît du document au lieu d'y rester vide. */
function prune<T extends Record<string, unknown>>(value: T): T {
  const result = { ...value };
  for (const key of ["visualUrl", "visualDescription", "soundUrl", "animationCue"]) {
    if (result[key] === "") delete (result as Record<string, unknown>)[key];
  }
  return result;
}

/** Compte les scènes et choix effectivement dotés d'un média. */
export function draftMediaCoverage(draft: NarrativeDraft) {
  const nodesWithVisual = draft.nodes.filter((node) => node.visualUrl).length;
  const choices = draft.nodes.flatMap((node) => node.choices);
  return {
    nodes: draft.nodes.length,
    nodesWithVisual,
    choices: choices.length,
    choicesWithSound: choices.filter((choice) => choice.soundUrl).length,
    choicesWithCue: choices.filter((choice) => choice.animationCue).length,
    /** Un visuel sans description alternative est un défaut d'accessibilité. */
    visualsWithoutDescription: draft.nodes.filter((node) => node.visualUrl && !node.visualDescription).length,
  };
}
