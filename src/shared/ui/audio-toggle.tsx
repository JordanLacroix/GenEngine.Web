"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/shared/audio/audio-provider";

/**
 * Réglage sonore de la HUD.
 *
 * Le bouton reste visible mais désactivé dès que rien ne peut sortir des
 * haut-parleurs, et il dit **lequel** des deux empêchements s'applique.
 * Auparavant il ne considérait que le chargement du manifeste : sur un
 * navigateur incapable de lire les formats publiés, il s'affichait donc actif,
 * se laissait activer, et ne produisait aucun son. Un réglage qui ne règle rien
 * est un mensonge de l'interface.
 */
const unavailableLabel = {
  "no-pack": "Son indisponible : aucun pack audio n’est publié pour cette instance.",
  "unsupported-format": "Son indisponible : ce navigateur ne sait lire aucun des formats publiés par le pack.",
} as const;

export function AudioToggle() {
  const { enabled, available, unavailableReason, ambienceStatus, setEnabled, source } = useAudio();
  const label = unavailableReason
    ? unavailableLabel[unavailableReason]
    : enabled ? "Couper le son" : "Activer le son";
  // L'ambiance manquante est annoncée là où la personne cherche le son, plutôt
  // que laissée à un silence qu'on confondrait avec une panne.
  const ambienceNote = ambienceStatus === "missing"
    ? " · Aucune ambiance n’est fournie pour ce lieu : seules les signatures sonnent."
    : "";
  return <button
    className="hud-toggle"
    type="button"
    aria-pressed={available ? enabled : undefined}
    aria-label={`${label}${ambienceNote}`}
    title={available ? `${label} · ${source.name} (${source.license})${ambienceNote}` : label}
    disabled={!available}
    onClick={() => setEnabled(!enabled)}
  >
    {enabled && available ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
  </button>;
}
