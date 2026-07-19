export type StoryMood = "mystery" | "wonder" | "adventure";

export interface StorySummary {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  synopsis: string;
  author: string;
  durationMinutes: number;
  progress?: number;
  mood: StoryMood;
  accent: string;
  scenarioVersionId?: string;
  /** Identifiant du scénario, stable d'une version à l'autre. */
  scenarioId?: string;
  /** Catégorie déclarée par le catalogue Authoring, quand elle existe. */
  categoryId?: string;
}

export interface DemoChoice {
  id: string;
  label: string;
  nextSceneId: string;
  tone: string;
}

/**
 * Nature d'une fin, dans la convention du contenu canonique « Le Diapason ».
 * Le moteur ne connaît qu'`isEnding` : cette distinction reste locale à la
 * démonstration et n'est jamais présentée comme un contrat serveur.
 */
export type DemoOutcome = "accord" | "partielle" | "rupture";

export interface DemoScene {
  id: string;
  chapter: string;
  title: string;
  body: string[];
  atmosphere: string;
  choices: DemoChoice[];
  /** Renseigné uniquement sur une scène terminale (`choices` vide). */
  outcome?: DemoOutcome;
  interaction?: { kind: "signal" | "object" | "gesture"; label: string; hint: string };
}

export interface DemoStory extends StorySummary {
  scenes: DemoScene[];
  openingSceneId: string;
}
