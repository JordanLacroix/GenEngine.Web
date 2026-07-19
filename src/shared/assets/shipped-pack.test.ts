import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAudioManifest } from "@/shared/audio/audio-contract";
import { parseAssetPackManifest, resolveAssetReference } from "@/shared/assets/asset-pack";

/**
 * Le pack réellement servi est le sujet du test : aucune fixture ne le remplace.
 * Un fichier manquant, renommé ou corrompu échoue ici plutôt que dans le
 * navigateur d'un joueur — un manifeste qui promet un asset introuvable est
 * précisément ce que cette tranche devait supprimer.
 */
const publicRoot = join(process.cwd(), "public");

function readServed(url: string): Buffer {
  const file = join(publicRoot, url.replace(/^\//, ""));
  expect(existsSync(file), `Le manifeste publie « ${url} », absent de public/.`).toBe(true);
  return readFileSync(file);
}

describe("pack d'assets servi par l'instance", () => {
  const manifest = parseAssetPackManifest(JSON.parse(readFileSync(join(publicRoot, "packs", "manifest.json"), "utf8")));

  it("publie le pack diapason-core", () => {
    expect(manifest.packId).toBe("diapason-core");
    expect(manifest.assets.length).toBe(62);
    expect(manifest.license).toBe("CC0-1.0");
    // Les manques déclarés par le pack amont sont conservés : une absence
    // annoncée vaut mieux qu'un silence.
    expect(manifest.gaps.map((gap) => gap.role)).toContain("ambience");
  });

  it("sert chaque asset annoncé, à l'octet près", () => {
    for (const asset of manifest.assets) {
      expect(asset.path.startsWith("/packs/diapason-core/"), `${asset.id} : chemin hors du pack.`).toBe(true);
      expect(createHash("sha256").update(readServed(asset.path)).digest("hex"), `${asset.id} : empreinte divergente.`).toBe(asset.sha256);
    }
  });

  it("propose les deux types attendus par les champs du Studio", () => {
    const kinds = new Set(manifest.assets.map((asset) => asset.kind));
    expect(kinds).toEqual(new Set(["image", "audio"]));
  });

  it("résout une référence packId:assetId vers une URL réellement servie", () => {
    const resolved = resolveAssetReference("diapason-core:sfx.choice.confirm", manifest);
    expect(resolved?.kind).toBe("audio");
    expect(resolved?.url).toBe("/packs/diapason-core/sfx/confirmation_001.ogg");
    expect(existsSync(join(publicRoot, "packs/diapason-core/sfx/confirmation_001.ogg"))).toBe(true);
  });

  it("ne résout pas une référence vers un autre pack ni un asset inconnu", () => {
    expect(resolveAssetReference("acme-brand:sfx.choice.confirm", manifest)).toBeUndefined();
    expect(resolveAssetReference("diapason-core:sfx.inexistant", manifest)).toBeUndefined();
  });
});

describe("manifeste audio de l'application", () => {
  const audio = parseAudioManifest(JSON.parse(readFileSync(join(publicRoot, "audio", "manifest.json"), "utf8")));

  it("lie chaque signal déclaré à un fichier réellement servi", () => {
    expect(audio.entries.length).toBeGreaterThan(0);
    for (const entry of audio.entries) {
      for (const source of entry.sources) {
        expect(source.mimeType).toBe("audio/ogg");
        readServed(source.url);
      }
    }
  });

  it("ne déclare aucune ambiance, que le pack annonce ne pas fournir", () => {
    // Lier une ambiance à un son court serait inventer un contenu absent.
    expect(audio.entries.filter((entry) => entry.cue.startsWith("ambience."))).toHaveLength(0);
  });
});
