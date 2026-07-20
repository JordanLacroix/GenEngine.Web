import { describe, expect, it } from "vitest";
import {
  cueForDemoOutcome, cueForFeedbackTone, cueForPlayerCommand, cueForSessionStatus, wiredCues,
} from "./audio-signals";
import { manifestAudioSource } from "./audio-source";
import { parseAudioManifest, supportedManifestVersion } from "./audio-contract";
import manifest from "../../../public/audio/manifest.json";

/**
 * Ces signaux n'étaient déclenchés nulle part : `play()` n'avait aucun appelant
 * dans `src/`, et rien ne le signalait. La suite ci-dessous verrouille la
 * correspondance « évènement visible → signal » afin qu'un débranchement casse
 * un test au lieu de rendre le produit silencieux sans bruit.
 */

describe("cueForFeedbackTone", () => {
  it("sonne l'erreur et la réussite, qui sont déjà affichées comme notices", () => {
    expect(cueForFeedbackTone("error")).toBe("signature.error");
    expect(cueForFeedbackTone("success")).toBe("signature.reward");
  });

  it("laisse une information de fond muette", () => {
    expect(cueForFeedbackTone("info")).toBeUndefined();
  });
});

describe("cueForPlayerCommand", () => {
  it("sonne le choix accepté par le moteur", () => {
    expect(cueForPlayerCommand("choice")).toBe("signature.choice");
    expect(cueForPlayerCommand("answer")).toBe("signature.choice");
  });

  it("traite la consultation d'un document comme l'ouverture d'un passage", () => {
    expect(cueForPlayerCommand("consult")).toBe("signature.door");
  });

  it("ne transforme pas un réglage de session en évènement narratif", () => {
    expect(cueForPlayerCommand("pause")).toBeUndefined();
    expect(cueForPlayerCommand("resume")).toBeUndefined();
  });
});

describe("cueForSessionStatus", () => {
  it("distingue la fin atteinte de la partie perdue", () => {
    expect(cueForSessionStatus("Completed")).toBe("music.ending");
    expect(cueForSessionStatus("Abandoned")).toBe("music.gameOver");
  });

  it("reste muet tant que la session est en cours", () => {
    expect(cueForSessionStatus("AwaitingInput")).toBeUndefined();
    expect(cueForSessionStatus("Paused")).toBeUndefined();
  });
});

describe("cueForDemoOutcome", () => {
  it("ferme une rupture autrement qu'un accord", () => {
    expect(cueForDemoOutcome("rupture")).toBe("music.gameOver");
    expect(cueForDemoOutcome("accord")).toBe("music.ending");
    expect(cueForDemoOutcome("partielle")).toBe("music.ending");
  });
});

describe("manifeste publié", () => {
  const source = manifestAudioSource(parseAudioManifest(manifest), () => true);

  it("fournit un asset pour chaque signal réellement câblé à l'interface", () => {
    // Sans cette garde, un signal peut être appelé par un composant sans
    // qu'aucun fichier ne lui réponde : l'appel est alors neutre, et le défaut
    // est invisible jusqu'à ce que quelqu'un tende l'oreille.
    const orphans = wiredCues.filter((cue) => !source.resolve(cue));
    expect(orphans).toEqual([]);
  });

  it("ne publie aucune ambiance : le manque est constaté, pas contourné", () => {
    // Le pack `diapason-core` déclare ne fournir aucune boucle d'ambiance. Les
    // vues qui en demandent une obtiennent donc `undefined`, et le fournisseur
    // annonce l'état `missing` au lieu de laisser un silence ambigu. Ce test
    // documente le manque ; il tombera le jour où une ambiance sera livrée.
    expect(source.resolve("ambience.map")).toBeUndefined();
    expect(source.resolve("ambience.home")).toBeUndefined();
  });

  it("est lu par la version de contrat que le client prend en charge", () => {
    expect(manifest.version).toBe(supportedManifestVersion);
  });
});
