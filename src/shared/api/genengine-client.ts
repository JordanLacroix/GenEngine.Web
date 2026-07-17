import type { StorySummary } from "@/entities/story/model/story";

interface PublishedScenarioContract {
  scenarioId: string;
  versionId: string;
  versionNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  publishedAt: string;
  snapshotHash: string;
}

export interface GenEngineClient {
  listPublishedStories(signal?: AbortSignal): Promise<StorySummary[]>;
  listLibrary(signal?: AbortSignal): Promise<StorySummary[]>;
}

export class HttpGenEngineClient implements GenEngineClient {
  public constructor(private readonly baseUrl: string) {}
  public async listPublishedStories(signal?: AbortSignal): Promise<StorySummary[]> {
    const stories = await this.get<PublishedScenarioContract[]>("/catalog", signal);
    return stories.map((story, index) => ({
      id: story.versionId,
      slug: story.scenarioId,
      title: story.title,
      eyebrow: `Version ${story.versionNumber}`,
      synopsis: story.description,
      author: "Communauté GenEngine",
      durationMinutes: story.estimatedMinutes,
      mood: index % 2 === 0 ? "mystery" : "wonder",
      accent: index % 2 === 0 ? "ember" : "verdigris",
      scenarioVersionId: story.versionId,
    }));
  }

  public listLibrary(signal?: AbortSignal) { return this.listPublishedStories(signal); }

  private async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(new URL(path, this.baseUrl), { signal });
    if (!response.ok) throw new Error(`GenEngine API returned ${response.status}`);
    return response.json() as Promise<T>;
  }
}

// Replace this boundary with a generated OpenAPI client when contracts are frozen.
// Narrative rules remain exclusively in the backend.
