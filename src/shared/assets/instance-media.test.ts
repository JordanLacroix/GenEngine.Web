import { describe, expect, it } from "vitest";
import type { MediaConfigurationContract } from "@/shared/api/contracts";
import type { AssetPackManifest } from "@/shared/assets/asset-pack";
import { resolveLocationMedia } from "@/shared/assets/instance-media";

const manifest: AssetPackManifest = {
  version: 1,
  packId: "diapason-core",
  name: "Diapason — pack CC0",
  license: "CC0-1.0",
  attribution: "Kenney",
  assets: [
    { id: "ui.panel.frame", kind: "image", role: "Cadre", path: "/packs/diapason-core/ui/frame.svg" },
    { id: "sfx.choice.confirm", kind: "audio", role: "Choix", path: "/packs/diapason-core/sfx/confirm.ogg" },
  ],
  gaps: [],
};

function media(overrides: Partial<MediaConfigurationContract["locations"][number]>, enabled = true): MediaConfigurationContract {
  return { enabled, defaultMuted: true, locations: [{ location: "map", ...overrides }] };
}

describe("resolveLocationMedia", () => {
  it("résout les deux formes acceptées par le moteur", () => {
    const resolved = resolveLocationMedia(
      media({ backgroundUrl: "diapason-core:ui.panel.frame", ambienceUrl: "https://exemple.test/boucle.ogg" }),
      "map",
      manifest,
    );
    expect(resolved.backgroundUrl).toBe("/packs/diapason-core/ui/frame.svg");
    expect(resolved.ambienceUrl).toBe("https://exemple.test/boucle.ogg");
  });

  it("n'applique pas un asset dont le type ne correspond pas au champ", () => {
    // Un son assigné à un fond n'est pas affiché « au mieux » : il est ignoré.
    const resolved = resolveLocationMedia(media({ backgroundUrl: "diapason-core:sfx.choice.confirm" }), "map", manifest);
    expect(resolved.backgroundUrl).toBeUndefined();
  });

  it("ne résout rien sans manifeste, plutôt que de fabriquer une URL", () => {
    expect(resolveLocationMedia(media({ backgroundUrl: "diapason-core:ui.panel.frame" }), "map", undefined).backgroundUrl)
      .toBeUndefined();
  });

  it("respecte l'extinction des médias sans effacer les choix de l'opérateur", () => {
    expect(resolveLocationMedia(media({ backgroundUrl: "diapason-core:ui.panel.frame" }, false), "map", manifest))
      .toEqual({});
  });

  it("rend un objet vide pour un emplacement non configuré ou un bloc absent", () => {
    expect(resolveLocationMedia(media({ backgroundUrl: "diapason-core:ui.panel.frame" }), "player", manifest)).toEqual({});
    expect(resolveLocationMedia(undefined, "map", manifest)).toEqual({});
  });
});
