import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";

describe("formatDuration", () => {
  it.each([[18, "18 min"], [60, "1 h"], [95, "1 h 35"]])("formats %i minutes", (minutes, expected) => {
    expect(formatDuration(minutes as number)).toBe(expected);
  });
});
