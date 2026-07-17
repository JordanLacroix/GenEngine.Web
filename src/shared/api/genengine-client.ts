import type { StorySummary } from "@/entities/story/model/story";

export interface GenEngineClient {
  listPublishedStories(signal?: AbortSignal): Promise<StorySummary[]>;
  listLibrary(signal?: AbortSignal): Promise<StorySummary[]>;
}

export class HttpGenEngineClient implements GenEngineClient {
  public constructor(private readonly baseUrl: string) {}
  public listPublishedStories(signal?: AbortSignal) { return this.get<StorySummary[]>("/api/stories", signal); }
  public listLibrary(signal?: AbortSignal) { return this.get<StorySummary[]>("/api/library", signal); }

  private async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(new URL(path, this.baseUrl), { signal });
    if (!response.ok) throw new Error(`GenEngine API returned ${response.status}`);
    return response.json() as Promise<T>;
  }
}

// Replace this boundary with a generated OpenAPI client when contracts are frozen.
// Narrative rules remain exclusively in the backend.
