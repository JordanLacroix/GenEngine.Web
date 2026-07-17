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
}

export interface DemoStory extends StorySummary {
  scenes: DemoScene[];
  openingSceneId: string;
}
