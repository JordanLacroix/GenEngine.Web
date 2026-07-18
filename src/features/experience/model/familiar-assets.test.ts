import { describe, expect, it } from "vitest";
import { parseFamiliarAssetPack } from "./familiar-assets";

describe("familiar asset packs", () => {
  it("accepts presentation-only HTTPS assets", () => {
    const pack = parseFamiliarAssetPack(JSON.stringify({ schemaVersion: 1, id: "aster", name: "Aster", portraitUrl: "https://assets.example.test/aster.jpg", license: "CC0", attribution: "Example" }));
    expect(pack.id).toBe("aster");
  });

  it("rejects insecure or ownership-shaped manifests", () => {
    expect(() => parseFamiliarAssetPack(JSON.stringify({ schemaVersion: 1, id: "unsafe", name: "Unsafe", portraitUrl: "https://example.test/pet.jpg", license: "unknown", attribution: "unknown", ownerId: "player" }))).toThrow(/propriété/);
    expect(() => parseFamiliarAssetPack(JSON.stringify({ schemaVersion: 1, id: "unsafe", name: "Unsafe", portraitUrl: "http://example.test/pet.jpg", license: "unknown", attribution: "unknown" }))).toThrow(/HTTPS/);
  });
});
