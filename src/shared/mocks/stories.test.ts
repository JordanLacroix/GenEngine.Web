import { describe, expect, it } from "vitest";
import { demoStory } from "./stories";

const scenes = new Map(demoStory.scenes.map((scene) => [scene.id, scene]));
const endings = demoStory.scenes.filter((scene) => scene.choices.length === 0);

describe("demo story", () => {
  it("opens on a hub that samples three different use cases", () => {
    const opening = scenes.get(demoStory.openingSceneId);
    expect(opening).toBeDefined();
    expect(opening!.choices.map((choice) => choice.tone)).toEqual(["Lucidité", "Courage", "Transmission"]);
  });

  it("only uses Diapason posture vocabulary as choice tones", () => {
    const postures = ["Lucidité", "Discernement", "Arbitrage", "Courage", "Transmission", "Autonomie"];
    for (const scene of demoStory.scenes) {
      for (const choice of scene.choices) expect(postures).toContain(choice.tone);
    }
  });

  it("keeps every choice pointing at an existing scene, and every scene reachable", () => {
    const reachable = new Set<string>();
    const pending = [demoStory.openingSceneId];
    while (pending.length > 0) {
      const id = pending.pop()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      const scene = scenes.get(id);
      expect(scene, `scene ${id} is targeted but missing`).toBeDefined();
      pending.push(...scene!.choices.map((choice) => choice.nextSceneId));
    }
    expect(reachable.size).toBe(demoStory.scenes.length);
    expect(demoStory.scenes).toHaveLength(23);
  });

  it("ends on a summary instead of looping to the opening", () => {
    expect(endings.length).toBeGreaterThanOrEqual(3);
    expect(endings.every((scene) => scene.choices.length === 0)).toBe(true);
  });

  it("labels every ending with its outcome, following the canonical naming convention", () => {
    for (const scene of endings) {
      expect(scene.outcome, `ending ${scene.id} has no outcome`).toBeDefined();
      expect(scene.id.startsWith(`fin-${scene.outcome}`)).toBe(true);
    }
    for (const scene of demoStory.scenes.filter((candidate) => candidate.choices.length > 0)) {
      expect(scene.outcome).toBeUndefined();
    }
  });

  it("offers a failure ending in each of the three situations", () => {
    const ruptures = endings.filter((scene) => scene.outcome === "rupture");
    expect(ruptures.length).toBeGreaterThanOrEqual(3);
    for (const prefix of ["note", "reunion", "spec"]) {
      const reachesRupture = demoStory.scenes.some((scene) => scene.id.startsWith(prefix) && scene.choices.some((choice) => scenes.get(choice.nextSceneId)?.outcome === "rupture"));
      expect(reachesRupture, `situation ${prefix} has no failure ending`).toBe(true);
    }
  });

  it("carries no wording from the story Diapason replaced", () => {
    const serialized = JSON.stringify(demoStory).toLocaleLowerCase("fr");
    for (const word of ["phare", "brume", "lueur", "beacon", "maritime", "oiseaux"]) {
      expect(serialized, `legacy wording "${word}" is still present`).not.toContain(word);
    }
  });
});
