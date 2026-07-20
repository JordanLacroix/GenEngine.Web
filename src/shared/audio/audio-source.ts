import {
  type AudioAssetContract, type AudioCue, type AudioManifestContract, parseAudioManifest,
} from "./audio-contract";

/**
 * Résolution d'un signal vers un fichier réellement lisible par le navigateur.
 *
 * `canPlay` est injecté pour rester testable hors navigateur ; en production il
 * s'agit de `HTMLAudioElement.canPlayType`.
 */
export type CanPlay = (mimeType: string) => boolean;

export interface AudioSource {
  /** Nom du pack, affiché avec sa licence. */
  readonly name: string;
  readonly license: string;
  readonly attribution: string;
  /**
   * Signaux qui se résolvent **réellement** vers un fichier que ce navigateur
   * sait décoder. Un manifeste chargé ne suffit pas : un pack qui ne publie que
   * de l'Ogg laisse cette liste vide sur Safari, et l'interface doit alors
   * annoncer le son indisponible au lieu d'afficher un réglage inopérant.
   */
  readonly playableCues: readonly AudioCue[];
  /** `undefined` quand aucun asset n'est publié pour ce signal. */
  resolve(cue: AudioCue): AudioAssetContract | undefined;
}

export function browserCanPlay(mimeType: string): boolean {
  if (typeof Audio === "undefined") return false;
  return new Audio().canPlayType(mimeType) !== "";
}

/**
 * Source adossée à un manifeste. Pour chaque signal la première source dont le
 * type MIME est accepté gagne, comme dans la direction sonore de référence
 * (Opus/Ogg puis MP3).
 */
export function manifestAudioSource(manifest: AudioManifestContract, canPlay: CanPlay): AudioSource {
  const byCue = new Map<string, AudioAssetContract | undefined>();
  for (const entry of manifest.entries) {
    byCue.set(entry.cue, entry.sources.find((source) => canPlay(source.mimeType)));
  }
  return {
    name: manifest.name,
    license: manifest.license,
    attribution: manifest.attribution,
    playableCues: [...byCue].filter(([, asset]) => asset).map(([cue]) => cue as AudioCue),
    resolve: (cue) => byCue.get(cue),
  };
}

/**
 * Source par défaut, utilisée tant que le pack d'assets n'est pas livré.
 * Elle ne résout rien : l'interface reste silencieuse et le dit, plutôt que de
 * laisser croire qu'un son manque à cause d'un réglage utilisateur.
 */
export const silentAudioSource: AudioSource = {
  name: "Aucun pack audio",
  license: "—",
  attribution: "Le pack sonore n’est pas encore publié pour cette instance.",
  playableCues: [],
  resolve: () => undefined,
};

/**
 * Pourquoi le son ne peut pas être proposé. `undefined` quand il le peut.
 *
 * Les deux cas appellent des réponses différentes : publier un pack relève de
 * l'exploitant, changer de navigateur relève de la personne devant l'écran.
 */
export type AudioUnavailableReason = "no-pack" | "unsupported-format";

/**
 * Le son est-il **réellement** jouable ?
 *
 * Un manifeste chargé ne suffit pas : le pack livré ne publie que de l'Ogg, que
 * Safari refuse. Faire dépendre la disponibilité du seul chargement affichait
 * un réglage sonore actif dans un état où rien ne pouvait sortir — l'interface
 * mentait. La question est donc « au moins un signal se résout-il ? ».
 */
export function audioAvailability(
  source: AudioSource,
): { available: boolean; reason?: AudioUnavailableReason } {
  if (source.playableCues.length > 0) return { available: true };
  return { available: false, reason: source === silentAudioSource ? "no-pack" : "unsupported-format" };
}

/**
 * Charge le manifeste servi par le client. L'absence de manifeste est un état
 * normal et rend la source silencieuse ; un manifeste présent mais invalide
 * échoue explicitement et le message est remonté à l'appelant.
 */
export async function loadAudioSource(
  url: string,
  canPlay: CanPlay,
  fetchImpl: typeof fetch = fetch,
): Promise<{ source: AudioSource; error?: string }> {
  let response: Response;
  try {
    response = await fetchImpl(url, { cache: "no-store" });
  } catch {
    return { source: silentAudioSource };
  }
  if (response.status === 404) return { source: silentAudioSource };
  if (!response.ok) return { source: silentAudioSource, error: `Manifeste audio indisponible (${response.status}).` };
  try {
    return { source: manifestAudioSource(parseAudioManifest(await response.json()), canPlay) };
  } catch (error) {
    return { source: silentAudioSource, error: error instanceof Error ? error.message : "Manifeste audio invalide." };
  }
}
