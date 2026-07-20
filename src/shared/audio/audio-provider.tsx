"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from "react";
import {
  type AmbienceCue, type AudioCue, type AudioLayer, layerOf, layerVolume,
} from "@/shared/audio/audio-contract";
import {
  type AudioSource, type AudioUnavailableReason, audioAvailability, browserCanPlay, loadAudioSource,
  silentAudioSource,
} from "@/shared/audio/audio-source";

export type { AudioUnavailableReason };

const storageKey = "genengine.audio.enabled";
const manifestUrl = "/audio/manifest.json";

/**
 * Le réglage sonore vit hors de React : il est lu au premier rendu client et
 * partagé par toute l'application. `useSyncExternalStore` évite d'initialiser un
 * état dans un effet, qui provoquerait un rendu en cascade.
 */
const enabledListeners = new Set<() => void>();
function subscribeEnabled(listener: () => void) {
  enabledListeners.add(listener);
  return () => { enabledListeners.delete(listener); };
}
function readEnabled() { return window.localStorage.getItem(storageKey) === "on"; }
function writeEnabled(value: boolean) {
  window.localStorage.setItem(storageKey, value ? "on" : "off");
  for (const listener of enabledListeners) listener();
}

/** État de l'ambiance du lieu courant, annoncé plutôt que deviné. */
export type AmbienceStatus =
  /** Aucun lieu ne demande d'ambiance. */
  | "idle"
  /** Une ambiance est demandée et joue. */
  | "playing"
  /** Une ambiance est demandée mais le réglage sonore est coupé. */
  | "muted"
  /** Une ambiance est demandée et **aucun asset ne la fournit**. */
  | "missing";

interface AudioState {
  /** Le son est explicitement activé par la personne qui joue. */
  enabled: boolean;
  /**
   * Le son peut réellement être joué : un pack est publié **et** ce navigateur
   * sait décoder au moins un de ses fichiers. Un manifeste chargé dont aucune
   * source n'est lisible ne rend pas le son disponible.
   */
  available: boolean;
  unavailableReason?: AudioUnavailableReason;
  /** Ambiance du lieu courant, pour que l'interface puisse annoncer un manque. */
  ambienceStatus: AmbienceStatus;
  source: AudioSource;
  error?: string;
  setEnabled(value: boolean): void;
  /** Déclenche une signature courte. Sans asset, l'appel est neutre. */
  play(cue: AudioCue): void;
  /** Installe l'ambiance du lieu courant. `undefined` la coupe. */
  setAmbience(cue?: AmbienceCue): void;
  /**
   * Installe une ambiance choisie par l'opérateur dans la configuration
   * publiée, déjà résolue en URL chargeable. Elle prime sur le signal, qui
   * reste le défaut du produit : une instance qui n'a rien configuré garde le
   * comportement d'origine.
   */
  setAmbienceUrl(url?: string): void;
  /** Joue une piste longue assignée par l'opérateur, déjà résolue en URL. */
  playUrl(url: string, layer: AudioLayer): void;
}

const AudioContext = createContext<AudioState | undefined>(undefined);

export function useAudio(): AudioState {
  const value = useContext(AudioContext);
  if (!value) throw new Error("useAudio doit être utilisé dans AudioProvider.");
  return value;
}

/**
 * Le son n'est jamais le seul porteur d'une information : chaque signal double
 * une indication déjà visible. Il est désactivé par défaut et se règle depuis
 * la HUD.
 *
 * `prefers-reduced-motion` ne coupe **pas** l'ambiance. Ce réglage exprime une
 * demande sur le mouvement — vestibulaire —, pas sur le son ; le confondre
 * avec une préférence sonore rendait l'application muette pour ces personnes
 * alors que le bouton de la HUD s'affichait actif, c'est-à-dire mensonger. Le
 * son a déjà son propre réglage, explicite et coupé par défaut : activer le son
 * est un acte délibéré qu'une préférence d'animation n'a pas à contredire en
 * silence.
 */
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const enabled = useSyncExternalStore(subscribeEnabled, readEnabled, () => false);
  const [source, setSource] = useState<AudioSource>(silentAudioSource);
  const [error, setError] = useState<string>();
  const ambienceRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [ambience, setAmbienceState] = useState<AmbienceCue>();
  const [ambienceUrl, setAmbienceUrlState] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void loadAudioSource(manifestUrl, browserCanPlay).then((result) => {
      if (cancelled) return;
      setSource(result.source);
      setError(result.error);
    });
    return () => { cancelled = true; };
  }, []);

  const { available, reason: unavailableReason } = audioAvailability(source);

  const resolvedAmbienceUrl = ambienceUrl ?? (ambience ? source.resolve(ambience)?.url : undefined);
  const ambienceStatus: AmbienceStatus = !ambience && !ambienceUrl ? "idle"
    : !resolvedAmbienceUrl ? "missing"
      : enabled ? "playing" : "muted";

  const setEnabled = useCallback((value: boolean) => writeEnabled(value), []);

  const play = useCallback((cue: AudioCue) => {
    if (!enabled) return;
    const asset = source.resolve(cue);
    if (!asset) return;
    const layer = layerOf(cue);
    if (layer === "music") {
      const element = musicRef.current;
      if (!element) return;
      element.src = asset.url;
      element.volume = layerVolume.music;
      void element.play().catch(() => undefined);
      return;
    }
    // Les signatures sont brèves et peuvent se superposer : un élément jetable
    // évite de couper la précédente.
    const oneShot = new Audio(asset.url);
    oneShot.volume = layerVolume.signature;
    void oneShot.play().catch(() => undefined);
  }, [enabled, source]);

  const setAmbience = useCallback((cue?: AmbienceCue) => setAmbienceState(cue), []);
  const setAmbienceUrl = useCallback((url?: string) => setAmbienceUrlState(url), []);

  const playUrl = useCallback((url: string, layer: AudioLayer) => {
    if (!enabled) return;
    if (layer === "music") {
      const element = musicRef.current;
      if (!element) return;
      element.src = url;
      element.volume = layerVolume.music;
      void element.play().catch(() => undefined);
      return;
    }
    const oneShot = new Audio(url);
    oneShot.volume = layerVolume[layer];
    void oneShot.play().catch(() => undefined);
  }, [enabled]);

  useEffect(() => {
    const element = ambienceRef.current;
    if (!element) return;
    // Une URL assignée par l'opérateur prime sur le signal du pack : c'est le
    // choix explicite d'une instance, pas un défaut de produit.
    if (!enabled || !resolvedAmbienceUrl) { element.pause(); return; }
    if (element.getAttribute("src") !== resolvedAmbienceUrl) element.setAttribute("src", resolvedAmbienceUrl);
    element.volume = layerVolume.ambience;
    void element.play().catch(() => undefined);
  }, [enabled, resolvedAmbienceUrl]);

  useEffect(() => {
    // Un lieu qui réclame une ambiance qu'aucun asset ne fournit produit un
    // silence indistinguable d'une panne. Le pack livré n'en publie aucune : le
    // manque est donc tracé, plutôt que subi.
    if (ambienceStatus !== "missing" || !ambience) return;
    console.info(`[audio] Ambiance « ${ambience} » demandée mais absente du pack publié : ce lieu reste silencieux.`);
  }, [ambience, ambienceStatus]);

  const value = useMemo<AudioState>(
    () => ({
      enabled, available, unavailableReason, ambienceStatus, source, error,
      setEnabled, play, setAmbience, setAmbienceUrl, playUrl,
    }),
    [
      ambienceStatus, available, enabled, error, play, playUrl, setAmbience, setAmbienceUrl,
      setEnabled, source, unavailableReason,
    ],
  );

  return <AudioContext.Provider value={value}>
    {children}
    <audio ref={ambienceRef} loop preload="none" aria-hidden="true" />
    <audio ref={musicRef} preload="none" aria-hidden="true" />
  </AudioContext.Provider>;
}

/** Installe l'ambiance d'un lieu tant que le composant est monté. */
export function useAmbience(cue: AmbienceCue) {
  const { setAmbience } = useAudio();
  useEffect(() => {
    setAmbience(cue);
    return () => setAmbience(undefined);
  }, [cue, setAmbience]);
}
