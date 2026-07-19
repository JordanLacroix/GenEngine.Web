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

export interface DemoScene {
  id: string;
  chapter: string;
  title: string;
  body: string[];
  atmosphere: string;
  choices: DemoChoice[];
  interaction?: { kind: "signal" | "object" | "gesture"; label: string; hint: string };
}

export interface DemoStory extends StorySummary {
  scenes: DemoScene[];
  openingSceneId: string;
}
