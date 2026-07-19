import { describe, expect, it } from "vitest";
import type { ExperienceDocumentContract } from "@/shared/api/contracts";
import {
  type MediaConfiguration, mediaCoverage, mediaLocations, mediaSupport, normalizeMedia,
  updateGameOverMedia, updateMediaLocation,
} from "./media-configuration";

const media: MediaConfiguration = {
  enabled: true,
  defaultMuted: true,
  locations: [{ location: "map", ambienceUrl: "diapason:wind", backgroundUrl: "https://cdn.example/map.png" }],
};
const document = (value?: MediaConfiguration) => ({ media: value } as unknown as ExperienceDocumentContract);

describe("mediaSupport", () => {
  it("annonce l'absence du bloc au lieu de le fabriquer", () => {
    const support = mediaSupport(document(undefined));
    expect(support.state).toBe("absent");
    expect(support.state === "absent" && support.reason).toMatch(/ne publie pas/);
  });

  it("annonce également l'absence quand le document entier manque", () => {
    expect(mediaSupport(undefined).state).toBe("absent");
  });

  it("expose le bloc complété de tous les lieux connus", () => {
    const support = mediaSupport(document(media));
    expect(support.state).toBe("supported");
    if (support.state !== "supported") return;
    expect(support.media.locations.map((entry) => entry.location)).toEqual([...mediaLocations]);
    expect(support.media.locations.find((entry) => entry.location === "map")?.ambienceUrl).toBe("diapason:wind");
  });
});

describe("normalizeMedia", () => {
  it("garde la coupure du son par défaut sauf refus explicite", () => {
    expect(normalizeMedia({ ...media, defaultMuted: undefined as unknown as boolean }).defaultMuted).toBe(true);
    expect(normalizeMedia({ ...media, defaultMuted: false }).defaultMuted).toBe(false);
  });
});

describe("updateMediaLocation", () => {
  it("modifie un seul lieu", () => {
    const next = updateMediaLocation(media, "home", { musicUrl: "diapason:theme" });
    expect(next.locations.find((entry) => entry.location === "home")?.musicUrl).toBe("diapason:theme");
    expect(next.locations.find((entry) => entry.location === "map")?.ambienceUrl).toBe("diapason:wind");
  });

  it("retire une valeur vidée au lieu d'écrire une chaîne vide", () => {
    const next = updateMediaLocation(media, "map", { ambienceUrl: "" });
    expect(next.locations.find((entry) => entry.location === "map")).not.toHaveProperty("ambienceUrl");
  });

  it("écrit la fin de partie sans toucher aux lieux", () => {
    const next = updateGameOverMedia(media, { musicUrl: "diapason:requiem", bpm: 60 });
    expect(next.gameOver).toEqual({ musicUrl: "diapason:requiem", bpm: 60 });
    expect(next.locations).toHaveLength(mediaLocations.length);
  });
});

describe("mediaCoverage", () => {
  it("compte les lieux réellement dotés d'un média", () => {
    expect(mediaCoverage(media)).toEqual({ assigned: 1, total: mediaLocations.length });
  });
});
