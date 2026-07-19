/**
 * Contrat audio du client.
 *
 * Le moteur et le pack d'assets sont produits par d'autres tranches de travail.
 * Ce module ne décrit donc que ce dont l'interface a besoin : un vocabulaire de
 * signaux stable et un manifeste qui associe chaque signal à des fichiers.
 * Tant qu'aucun manifeste n'est publié, chaque signal se résout à `undefined` et
 * la lecture devient une opération neutre — jamais un son inventé, jamais une
 * fixture silencieusement substituée à une source réelle.
 */

/** Ambiances continues, attachées à un lieu de l'application. */
export type AmbienceCue =
  | "ambience.home"
  | "ambience.map"
  | "ambience.scene"
  | "ambience.companion"
  | "ambience.journal";

/** Signatures courtes, déclenchées par une action. */
export type SignatureCue =
  | "signature.choice"
  | "signature.error"
  | "signature.reward"
  | "signature.door";

/** Pistes longues, réservées aux bascules d'état narratif. */
export type MusicCue = "music.gameOver" | "music.ending";

export type AudioCue = AmbienceCue | SignatureCue | MusicCue;

export type AudioLayer = "ambience" | "signature" | "music";

export function layerOf(cue: AudioCue): AudioLayer {
  if (cue.startsWith("ambience.")) return "ambience";
  if (cue.startsWith("signature.")) return "signature";
  return "music";
}

/**
 * Volumes applicatifs par couche, repris de la direction sonore de référence
 * (`specs` du POC : ambiance 0,18 · musique 0,42 · signatures 0,46).
 */
export const layerVolume: Record<AudioLayer, number> = {
  ambience: 0.18,
  music: 0.42,
  signature: 0.46,
};

/** Une source déclarée pour un signal, dans l'ordre de préférence. */
export interface AudioAssetContract {
  /** URL absolue ou chemin servi par le client. */
  url: string;
  /** Type MIME complet, `canPlayType` est interrogé avec. */
  mimeType: string;
}

export interface AudioEntryContract {
  cue: AudioCue;
  sources: AudioAssetContract[];
  /** Licence et attribution du pack, affichées dans l'interface. */
  license?: string;
  attribution?: string;
}

export interface AudioManifestContract {
  /** Version du manifeste. Une version inconnue échoue explicitement. */
  version: number;
  name: string;
  license: string;
  attribution: string;
  entries: AudioEntryContract[];
}

export const supportedManifestVersion = 1;

/**
 * Valide un manifeste sans rien deviner : une structure inattendue lève, elle
 * n'est pas réinterprétée (invariant 14).
 */
export function parseAudioManifest(raw: unknown): AudioManifestContract {
  if (typeof raw !== "object" || raw === null) throw new Error("Manifeste audio illisible.");
  const candidate = raw as Partial<AudioManifestContract>;
  if (candidate.version !== supportedManifestVersion) {
    throw new Error(`Version de manifeste audio non prise en charge : ${String(candidate.version)}.`);
  }
  if (!Array.isArray(candidate.entries)) throw new Error("Manifeste audio sans entrées.");
  for (const entry of candidate.entries) {
    if (typeof entry?.cue !== "string" || !Array.isArray(entry.sources)) {
      throw new Error("Entrée de manifeste audio invalide.");
    }
    for (const source of entry.sources) {
      if (typeof source?.url !== "string" || typeof source?.mimeType !== "string") {
        throw new Error(`Source audio invalide pour « ${entry.cue} ».`);
      }
    }
  }
  return {
    version: candidate.version,
    name: typeof candidate.name === "string" ? candidate.name : "Pack audio",
    license: typeof candidate.license === "string" ? candidate.license : "Non précisée",
    attribution: typeof candidate.attribution === "string" ? candidate.attribution : "Non précisée",
    entries: candidate.entries,
  };
}
