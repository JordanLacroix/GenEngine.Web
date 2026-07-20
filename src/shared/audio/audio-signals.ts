import type { AudioCue, MusicCue, SignatureCue } from "@/shared/audio/audio-contract";

/**
 * Choix du signal à jouer pour un évènement de l'interface.
 *
 * Ces fonctions sont pures et vivent hors des composants pour une raison
 * précise : le défaut qu'elles corrigent — aucun signal n'était jamais
 * déclenché — n'avait aucun test parce que la décision était censée vivre dans
 * des gestionnaires de clic, non testables sans navigateur. Isolée ici, la
 * correspondance « évènement visible → son » est vérifiable, et un signal qui
 * cesserait d'être associé fait échouer la suite.
 *
 * Règle qui gouverne chaque entrée : le son **double** un retour déjà visible.
 * Aucune valeur renvoyée ici ne correspond à un évènement silencieux à l'écran.
 */

/**
 * Retour du système de notices. Chaque notice est affichée dans la région
 * `notice-region` avec son icône et son texte : le son ne fait que la souligner.
 * `info` reste muet — une information de fond n'a pas à sonner.
 */
export function cueForFeedbackTone(tone: "success" | "error" | "info"): SignatureCue | undefined {
  if (tone === "error") return "signature.error";
  if (tone === "success") return "signature.reward";
  return undefined;
}

/** Commandes que le lecteur connecté envoie au moteur. */
export type PlayerCommandKind =
  | "choice" | "continue" | "consult" | "answer" | "text" | "confirm" | "pause" | "resume";

/**
 * Une commande acceptée par le moteur redessine toujours la scène. Le signal
 * accompagne cette bascule visible.
 *
 * `consult` ouvre un document : c'est l'ouverture d'un passage, donc la porte.
 * `pause` et `resume` changent une icône de la HUD sans faire avancer le récit,
 * et restent muets pour ne pas transformer un réglage en évènement narratif.
 */
export function cueForPlayerCommand(kind: PlayerCommandKind): SignatureCue | undefined {
  if (kind === "consult") return "signature.door";
  if (kind === "pause" || kind === "resume") return undefined;
  return "signature.choice";
}

/**
 * Bascules d'état narratif, doublées à l'écran par l'épilogue et son bilan.
 * Seule une **transition** vers ces états déclenche la piste : l'appelant
 * compare l'ancien et le nouveau statut.
 */
export function cueForSessionStatus(status: string): MusicCue | undefined {
  if (status === "Completed") return "music.ending";
  if (status === "Abandoned") return "music.gameOver";
  return undefined;
}

/** Fin de la démonstration hors ligne, doublée par le bilan affiché. */
export function cueForDemoOutcome(outcome: "accord" | "partielle" | "rupture"): MusicCue {
  return outcome === "rupture" ? "music.gameOver" : "music.ending";
}

/**
 * Signaux effectivement câblés à un évènement de l'interface.
 *
 * Sert de garde : un signal listé ici mais qu'aucun appelant ne déclenche est
 * un signal mort, et c'est exactement l'état dont ce correctif sort le produit.
 */
export const wiredCues: readonly AudioCue[] = [
  "signature.choice", "signature.error", "signature.reward", "signature.door",
  "music.ending", "music.gameOver",
];
