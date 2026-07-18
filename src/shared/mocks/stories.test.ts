import { describe, expect, it } from "vitest";
import { demoStory } from "./stories";

describe("demo story", () => {
  it("ends on a summary instead of looping to the opening", () => {
    const endings = demoStory.scenes.filter((scene) => scene.chapter.startsWith("Épilogue"));
    expect(endings).toHaveLength(2);
    expect(endings.every((scene) => scene.choices.length === 0)).toBe(true);
  });
});
