"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/shared/audio/audio-provider";

/**
 * Réglage sonore de la HUD. Tant qu'aucun pack n'est publié, le bouton reste
 * visible mais désactivé et explique pourquoi : proposer un son qui n'existe pas
 * serait aussi trompeur que le masquer sans le dire.
 */
export function AudioToggle() {
  const { enabled, available, setEnabled, source } = useAudio();
  const label = !available
    ? "Son indisponible : aucun pack audio n’est publié pour cette instance."
    : enabled ? "Couper le son" : "Activer le son";
  return <button
    className="hud-toggle"
    type="button"
    aria-pressed={available ? enabled : undefined}
    aria-label={label}
    title={available ? `${label} · ${source.name} (${source.license})` : label}
    disabled={!available}
    onClick={() => setEnabled(!enabled)}
  >
    {enabled && available ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
  </button>;
}
