import { describe, expect, it } from "vitest";
import { layerOf, layerVolume, parseAudioManifest, supportedManifestVersion } from "./audio-contract";
import { loadAudioSource, manifestAudioSource, silentAudioSource } from "./audio-source";

const manifest = {
  version: supportedManifestVersion,
  name: "Kenney CC0",
  license: "CC0-1.0",
  attribution: "Kenney.nl",
  entries: [{
    cue: "signature.choice",
    sources: [
      { url: "/audio/choice.ogg", mimeType: "audio/ogg; codecs=\"opus\"" },
      { url: "/audio/choice.mp3", mimeType: "audio/mpeg" },
    ],
  }],
};

describe("layerOf", () => {
  it("classe chaque signal dans sa couche", () => {
    expect(layerOf("ambience.map")).toBe("ambience");
    expect(layerOf("signature.reward")).toBe("signature");
    expect(layerOf("music.gameOver")).toBe("music");
  });

  it("garde l'ambiance nettement en retrait de la musique", () => {
    expect(layerVolume.ambience).toBeLessThan(layerVolume.music);
  });
});

describe("parseAudioManifest", () => {
  it("accepte un manifeste conforme", () => {
    expect(parseAudioManifest(manifest).entries).toHaveLength(1);
  });

  it("refuse une version inconnue au lieu de l'interpréter", () => {
    expect(() => parseAudioManifest({ ...manifest, version: 99 })).toThrow(/non prise en charge/);
  });

  it("refuse une source incomplète", () => {
    expect(() => parseAudioManifest({
      ...manifest, entries: [{ cue: "signature.choice", sources: [{ url: "/a.ogg" }] }],
    })).toThrow(/Source audio invalide/);
  });
});

describe("manifestAudioSource", () => {
  it("retient le premier format lisible", () => {
    const source = manifestAudioSource(parseAudioManifest(manifest), (mime) => mime === "audio/mpeg");
    expect(source.resolve("signature.choice")?.url).toBe("/audio/choice.mp3");
  });

  it("ne résout rien quand aucun format n'est lisible", () => {
    const source = manifestAudioSource(parseAudioManifest(manifest), () => false);
    expect(source.resolve("signature.choice")).toBeUndefined();
  });

  it("ne résout rien pour un signal absent du manifeste", () => {
    const source = manifestAudioSource(parseAudioManifest(manifest), () => true);
    expect(source.resolve("music.gameOver")).toBeUndefined();
  });
});

describe("loadAudioSource", () => {
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  it("reste silencieuse sans manifeste publié", async () => {
    const result = await loadAudioSource("/audio/manifest.json", () => true, async () => new Response(null, { status: 404 }));
    expect(result.source).toBe(silentAudioSource);
    expect(result.error).toBeUndefined();
  });

  it("reste silencieuse quand le réseau échoue", async () => {
    const result = await loadAudioSource("/audio/manifest.json", () => true, async () => { throw new Error("offline"); });
    expect(result.source).toBe(silentAudioSource);
  });

  it("signale explicitement un manifeste invalide au lieu de deviner", async () => {
    const result = await loadAudioSource("/audio/manifest.json", () => true, async () => ok({ version: 42 }));
    expect(result.source).toBe(silentAudioSource);
    expect(result.error).toMatch(/non prise en charge/);
  });

  it("expose la licence et l'attribution du pack chargé", async () => {
    const result = await loadAudioSource("/audio/manifest.json", () => true, async () => ok(manifest));
    expect(result.source.license).toBe("CC0-1.0");
    expect(result.source.attribution).toBe("Kenney.nl");
  });
});
