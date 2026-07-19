"use client";

import { useEffect, useState } from "react";
import type {
  MediaConfigurationContract, MediaLocationContract, PublishedExperienceContract,
} from "@/shared/api/contracts";
import {
  type AssetPackManifest, type AssetPackState, loadAssetPack, resolveAssetReference,
} from "@/shared/assets/asset-pack";

/**
 * Point unique de résolution des médias d'instance au runtime.
 *
 * Un champ média de la configuration publiée vaut soit une URL HTTPS absolue,
 * soit une référence `packId:assetId`. Les deux formes sont résolues ici, par
 * `resolveAssetReference`, exactement comme dans le Studio : un aperçu d'auteur
 * et le rendu d'un joueur ne peuvent pas diverger puisqu'ils appellent la même
 * fonction sur le même manifeste.
 *
 * Le manifeste est celui **servi par l'instance** (`/packs/manifest.json`).
 * C'est le client qui héberge le pack, pas seulement le backend : la
 * démonstration s'adresse à un visiteur anonyme et doit rester jouable sans
 * backend, or la seule origine qu'elle atteint alors est celle qui sert
 * l'application.
 *
 * Rien n'est inventé : sans manifeste, sans bloc `media` publié ou sur une
 * référence inconnue, la résolution rend `undefined` et l'appelant garde son
 * rendu par défaut (invariant 14 — le média est un enrichissement).
 */

export interface ResolvedLocationMedia {
  /** URL d'un visuel de fond réellement chargeable. */
  backgroundUrl?: string;
  ambienceUrl?: string;
  musicUrl?: string;
  bpm?: number;
  loop?: boolean;
}

/** Résout les trois assets d'un emplacement. Fonction pure, testable seule. */
export function resolveLocationMedia(
  media: MediaConfigurationContract | undefined,
  location: MediaLocationContract,
  manifest: AssetPackManifest | undefined,
): ResolvedLocationMedia {
  // `enabled: false` coupe les médias de l'instance sans effacer les choix de
  // l'opérateur : republier avec `enabled: true` les restitue tels quels.
  if (!media?.enabled) return {};
  const entry = media.locations.find((candidate) => candidate.location === location);
  if (!entry) return {};
  const image = (value?: string) => {
    const resolved = value ? resolveAssetReference(value, manifest) : undefined;
    return resolved?.kind === "image" ? resolved.url : undefined;
  };
  const audio = (value?: string) => {
    const resolved = value ? resolveAssetReference(value, manifest) : undefined;
    return resolved?.kind === "audio" ? resolved.url : undefined;
  };
  return {
    backgroundUrl: image(entry.backgroundUrl),
    ambienceUrl: audio(entry.ambienceUrl),
    musicUrl: audio(entry.musicUrl),
    bpm: entry.bpm,
    loop: entry.loop,
  };
}

interface InstanceMediaState {
  media?: MediaConfigurationContract;
  pack: AssetPackState;
  loading: boolean;
}

/**
 * La configuration publiée et le manifeste sont immuables pour la durée d'une
 * visite : ils sont chargés une fois et partagés, plutôt qu'une requête par
 * surface montée.
 */
let cached: Promise<InstanceMediaState> | undefined;

async function loadInstanceMedia(): Promise<InstanceMediaState> {
  const [pack, media] = await Promise.all([
    loadAssetPack(),
    (async () => {
      try {
        const response = await fetch("/api/experience", { cache: "no-store" });
        if (!response.ok) return undefined;
        const published = (await response.json()) as PublishedExperienceContract;
        return published.document.media;
      } catch {
        // Une instance sans backend joignable — la démonstration — n'a pas de
        // configuration publiée. Ce n'est pas une erreur : il n'y a simplement
        // aucun média d'instance à appliquer.
        return undefined;
      }
    })(),
  ]);
  return { media, pack, loading: false };
}

export function useInstanceMedia(location: MediaLocationContract): ResolvedLocationMedia & { loading: boolean } {
  const [state, setState] = useState<InstanceMediaState>({ pack: {}, loading: true });
  useEffect(() => {
    let cancelled = false;
    cached ??= loadInstanceMedia();
    void cached.then((value) => { if (!cancelled) setState(value); });
    return () => { cancelled = true; };
  }, []);
  return { ...resolveLocationMedia(state.media, location, state.pack.manifest), loading: state.loading };
}

/** Réinitialise le cache de module. Réservé aux tests. */
export function resetInstanceMediaCache() { cached = undefined; }
