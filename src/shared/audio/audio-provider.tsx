"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from "react";
import {
  type AmbienceCue, type AudioCue, layerOf, layerVolume,
} from "@/shared/audio/audio-contract";
import { type AudioSource, browserCanPlay, loadAudioSource, silentAudioSource } from "@/shared/audio/audio-source";

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

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(listener: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
function readReducedMotion() { return window.matchMedia(reducedMotionQuery).matches; }

interface AudioState {
  /** Le son est explicitement activé par la personne qui joue. */
  enabled: boolean;
  /** Un pack est publié : sans lui, proposer un réglage sonore serait mentir. */
  available: boolean;
  source: AudioSource;
  error?: string;
  setEnabled(value: boolean): void;
  /** Déclenche une signature courte. Sans asset, l'appel est neutre. */
  play(cue: AudioCue): void;
  /** Installe l'ambiance du lieu courant. `undefined` la coupe. */
  setAmbience(cue?: AmbienceCue): void;
}

const AudioContext = createContext<AudioState | undefined>(undefined);

export function useAudio(): AudioState {
  const value = useContext(AudioContext);
  if (!value) throw new Error("useAudio doit être utilisé dans AudioProvider.");
  return value;
}

/**
 * Le son n'est jamais le seul porteur d'une information : chaque signal double
 * une indication déjà visible. Il est désactivé par défaut, se règle depuis la
 * HUD, et l'ambiance continue reste coupée quand la personne demande moins
 * d'animations.
 */
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const enabled = useSyncExternalStore(subscribeEnabled, readEnabled, () => false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);
  const [source, setSource] = useState<AudioSource>(silentAudioSource);
  const [error, setError] = useState<string>();
  const ambienceRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [ambience, setAmbienceState] = useState<AmbienceCue>();

  useEffect(() => {
    let cancelled = false;
    void loadAudioSource(manifestUrl, browserCanPlay).then((result) => {
      if (cancelled) return;
      setSource(result.source);
      setError(result.error);
    });
    return () => { cancelled = true; };
  }, []);

  const available = source !== silentAudioSource;

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

  useEffect(() => {
    const element = ambienceRef.current;
    if (!element) return;
    const asset = ambience ? source.resolve(ambience) : undefined;
    if (!enabled || reducedMotion || !asset) { element.pause(); return; }
    if (element.getAttribute("src") !== asset.url) element.setAttribute("src", asset.url);
    element.volume = layerVolume.ambience;
    void element.play().catch(() => undefined);
  }, [ambience, enabled, reducedMotion, source]);

  const value = useMemo<AudioState>(
    () => ({ enabled, available, source, error, setEnabled, play, setAmbience }),
    [available, enabled, error, play, setAmbience, setEnabled, source],
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
