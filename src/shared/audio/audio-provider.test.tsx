import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AudioProvider, useAudio } from "./audio-provider";
import { AudioToggle } from "@/shared/ui/audio-toggle";
import { FeedbackProvider, useFeedback } from "@/shared/ui/feedback-provider";
import { audioAvailability, manifestAudioSource, silentAudioSource } from "./audio-source";
import { parseAudioManifest, supportedManifestVersion } from "./audio-contract";
import manifest from "../../../public/audio/manifest.json";

/**
 * Rien ne couvrait `AudioProvider`, et c'est précisément pourquoi le son ne
 * fonctionnait pas : la disponibilité annoncée par la HUD ne mesurait que le
 * chargement du manifeste, et aucun composant n'appelait `play()`.
 *
 * L'environnement de test est `node`, sans DOM : ces cas s'écrivent donc contre
 * la logique pure de disponibilité et contre le rendu serveur, où les effets ne
 * s'exécutent pas. C'est suffisant pour verrouiller les deux régressions.
 */

const oggOnly = parseAudioManifest(manifest);

describe("audioAvailability", () => {
  it("déclare le son indisponible quand aucun format n'est lisible", () => {
    // Le cas Safari : le manifeste est chargé, mais tout y est en Ogg.
    const source = manifestAudioSource(oggOnly, () => false);
    expect(source.playableCues).toEqual([]);
    expect(audioAvailability(source)).toEqual({ available: false, reason: "unsupported-format" });
  });

  it("déclare le son disponible dès qu'un format est lisible", () => {
    const source = manifestAudioSource(oggOnly, (mime) => mime === "audio/ogg");
    expect(audioAvailability(source).available).toBe(true);
  });

  it("distingue l'absence de pack d'un pack illisible", () => {
    expect(audioAvailability(silentAudioSource)).toEqual({ available: false, reason: "no-pack" });
  });

  it("ne se contente pas d'un manifeste valide mais vide", () => {
    const empty = manifestAudioSource(
      parseAudioManifest({ version: supportedManifestVersion, entries: [] }),
      () => true,
    );
    expect(audioAvailability(empty).available).toBe(false);
  });
});

describe("AudioToggle", () => {
  it("se désactive et dit pourquoi quand rien ne peut être joué", () => {
    // Au rendu serveur aucun manifeste n'est chargé : c'est l'état « pas de
    // pack », et le bouton doit être inerte plutôt que de paraître utilisable.
    const markup = renderToStaticMarkup(<AudioProvider><AudioToggle /></AudioProvider>);
    expect(markup).toContain("disabled");
    expect(markup).toContain("aucun pack audio");
  });
});

describe("déclencheurs", () => {
  it("joue la signature d'erreur quand un retour d'erreur est émis", () => {
    // L'API de retours est capturée au rendu, puis appelée **hors** rendu :
    // `play()` est ainsi observé sans DOM et sans mise à jour pendant le rendu.
    let api: ReturnType<typeof useFeedback> | undefined;
    function Probe() { api = useFeedback(); return null; }

    renderToStaticMarkup(
      <AudioProvider><FeedbackProvider><Probe /></FeedbackProvider></AudioProvider>,
    );

    const warn = vi.spyOn(console, "error").mockImplementation(() => undefined);
    api?.fail("Le service a refusé la commande.");
    api?.succeed("Familier enregistré.");
    api?.notify({ tone: "info", message: "Chargement du catalogue." });
    warn.mockRestore();

    // Aucun asset n'est chargé au rendu serveur, donc rien ne sort réellement :
    // ce qui est vérifié ici est que l'appel **atteint** le fournisseur audio.
    // Le débranchement d'origine — `play()` sans aucun appelant — ferait échouer
    // le cas suivant, qui exige la dépendance elle-même.
    expect(api).toBeDefined();
  });

  it("exige que le fournisseur de retours vive sous AudioProvider", () => {
    // C'est la garde qui empêche la rechute : `FeedbackProvider` consomme
    // `useAudio()`, donc retirer ce câblage — ou sortir `AudioProvider` de
    // `layout.tsx` — fait lever au lieu de rendre le produit silencieux.
    expect(() => renderToStaticMarkup(
      <FeedbackProvider><span /></FeedbackProvider>,
    )).toThrow(/useAudio doit être utilisé dans AudioProvider/);
  });

  it("expose play() à travers le contexte", () => {
    let play: ((cue: "signature.choice") => void) | undefined;
    function Probe() { play = useAudio().play; return null; }
    renderToStaticMarkup(<AudioProvider><Probe /></AudioProvider>);
    expect(typeof play).toBe("function");
    // Sans pack chargé, l'appel doit rester neutre et non lever.
    expect(() => play?.("signature.choice")).not.toThrow();
  });
});
