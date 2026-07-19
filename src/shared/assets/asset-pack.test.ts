import { describe, expect, it } from "vitest";
import {
  type AssetPackManifest, guessKindFromUrl, isHttpsUrl, loadAssetPack, parseAssetPackManifest,
  parseAssetReference, resolveAssetReference,
} from "./asset-pack";

const manifest: AssetPackManifest = {
  version: 1,
  packId: "diapason",
  name: "Diapason CC0",
  license: "CC0-1.0",
  attribution: "Kenney.nl",
  assets: [
    { id: "ui-click", kind: "audio", role: "ui.click", path: "/packs/diapason/ui-click.ogg", mimeType: "audio/ogg" },
    { id: "hall", kind: "image", role: "background", path: "/packs/diapason/hall.png", width: 1024, height: 640 },
  ],
  gaps: [{ role: "ambience", reason: "Le pack ne fournit aucune boucle d'ambiance." }],
};

describe("parseAssetReference", () => {
  it("lit une URL HTTPS absolue", () => {
    expect(parseAssetReference(" https://cdn.example/a.png ")).toEqual({ kind: "https", url: "https://cdn.example/a.png" });
  });

  it("lit une référence de pack", () => {
    expect(parseAssetReference("diapason:ui-click")).toEqual({ kind: "pack", packId: "diapason", assetId: "ui-click" });
  });

  it("rejette une valeur vide, un chemin relatif ou une URL non HTTPS", () => {
    expect(parseAssetReference("  ")).toBeUndefined();
    expect(parseAssetReference("/packs/a.ogg")).toBeUndefined();
    expect(parseAssetReference("http://example.com/a.png")).toBeUndefined();
    expect(parseAssetReference("diapason:")).toBeUndefined();
  });

  it("reconnaît une URL HTTPS", () => {
    expect(isHttpsUrl("https://example.com")).toBe(true);
    expect(isHttpsUrl("pas une url")).toBe(false);
  });
});

describe("resolveAssetReference", () => {
  it("résout un asset du pack chargé", () => {
    expect(resolveAssetReference("diapason:hall", manifest)).toEqual({
      url: "/packs/diapason/hall.png", kind: "image", entry: manifest.assets[1],
    });
  });

  it("ne résout rien sans manifeste, ce qui interdit d'inventer une URL", () => {
    expect(resolveAssetReference("diapason:hall", undefined)).toBeUndefined();
  });

  it("ne résout rien pour un asset inconnu ou un autre pack", () => {
    expect(resolveAssetReference("diapason:absent", manifest)).toBeUndefined();
    expect(resolveAssetReference("autre:hall", manifest)).toBeUndefined();
  });

  it("résout une URL HTTPS en devinant le type par l'extension", () => {
    expect(resolveAssetReference("https://cdn.example/a.ogg", undefined)).toEqual({ url: "https://cdn.example/a.ogg", kind: "audio" });
    expect(guessKindFromUrl("https://cdn.example/a.png?v=2")).toBe("image");
  });
});

describe("parseAssetPackManifest", () => {
  it("accepte un manifeste conforme et normalise les manques", () => {
    const parsed = parseAssetPackManifest({ ...manifest, gaps: undefined });
    expect(parsed.packId).toBe("diapason");
    expect(parsed.gaps).toEqual([]);
  });

  it("rejette une version inconnue au lieu de l'interpréter", () => {
    expect(() => parseAssetPackManifest({ ...manifest, version: 2 })).toThrow(/non prise en charge/);
  });

  it("rejette un asset sans chemin ou de type inconnu", () => {
    expect(() => parseAssetPackManifest({ ...manifest, assets: [{ id: "a", kind: "image" }] })).toThrow();
    expect(() => parseAssetPackManifest({ ...manifest, assets: [{ id: "a", kind: "video", path: "/a.mp4" }] })).toThrow(/inconnu/);
  });
});

describe("loadAssetPack", () => {
  const response = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });

  it("traite une absence de manifeste comme un état normal", async () => {
    await expect(loadAssetPack("/packs/manifest.json", async () => response(404))).resolves.toEqual({});
  });

  it("remonte une erreur explicite pour un manifeste invalide", async () => {
    const state = await loadAssetPack("/packs/manifest.json", async () => response(200, { version: 9 }));
    expect(state.manifest).toBeUndefined();
    expect(state.error).toMatch(/non prise en charge/);
  });

  it("charge un manifeste conforme", async () => {
    const state = await loadAssetPack("/packs/manifest.json", async () => response(200, manifest));
    expect(state.manifest?.assets).toHaveLength(2);
  });
});
