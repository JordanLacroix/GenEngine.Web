"use client";

import { AlertTriangle, Image as ImageIcon, Info, Music, Skull } from "lucide-react";
import { useState } from "react";
import type { AssetPackManifest } from "@/shared/assets/asset-pack";
import { resolveAssetReference } from "@/shared/assets/asset-pack";
import {
  type MediaConfiguration, type MediaLocation, mediaCoverage, mediaLocationLabels, mediaLocations,
  type MediaSupport, updateGameOverMedia, updateMediaLocation,
} from "../model/media-configuration";
import { AssetField, AssetPreview } from "./asset-field";

/**
 * Plan média : ce que l'on entend et ce que l'on voit, lieu par lieu.
 *
 * Quand l'instance ne publie pas de bloc `media`, la section explique ce qui
 * manque et n'affiche aucun formulaire d'assignation — l'opérateur peut malgré
 * tout auditionner le pack, qui ne dépend pas du moteur.
 */
export function MediaSection({
  support, manifest, packAbsentReason, onChange,
}: {
  support: MediaSupport;
  manifest?: AssetPackManifest;
  packAbsentReason?: string;
  onChange: (media: MediaConfiguration) => void;
}) {
  const [focus, setFocus] = useState<MediaLocation>("home");

  if (support.state === "absent") {
    return (
      <div className="studio-panel">
        <p className="studio-unavailable" role="status">
          <AlertTriangle aria-hidden="true" />
          <span>
            <strong>Le plan média n’est pas configurable sur cette instance.</strong>
            {support.reason} Le Studio n’écrit rien qu’il ne puisse enregistrer : dès que la
            configuration publiera <code>media</code>, cette section deviendra éditable sans autre changement.
          </span>
        </p>
        <PackBrowser manifest={manifest} packAbsentReason={packAbsentReason} />
      </div>
    );
  }

  const media = support.media;
  const coverage = mediaCoverage(media);
  const entry = media.locations.find((item) => item.location === focus) ?? { location: focus };

  return (
    <div className="studio-panel">
      <div className="studio-toggles">
        <label className="studio-switch">
          <input type="checkbox" checked={media.enabled} onChange={(event) => onChange({ ...media, enabled: event.target.checked })} />
          <span>Activer les médias configurés</span>
        </label>
        <label className="studio-switch">
          <input type="checkbox" checked={media.defaultMuted} onChange={(event) => onChange({ ...media, defaultMuted: event.target.checked })} />
          <span>Son coupé par défaut</span>
        </label>
        <p className="studio-note">
          <Info aria-hidden="true" />
          Le son reste toujours désactivable et ne porte jamais seul une information : chaque
          ambiance doit doubler un élément déjà lisible à l’écran.
        </p>
      </div>

      <p className="studio-coverage">{coverage.assigned} lieu(x) sur {coverage.total} disposent d’au moins un média.</p>

      <div className="media-layout">
        <div className="media-locations" role="tablist" aria-label="Lieux de l’application">
          {mediaLocations.map((location) => {
            const item = media.locations.find((candidate) => candidate.location === location);
            const filled = Boolean(item?.ambienceUrl ?? item?.musicUrl ?? item?.backgroundUrl);
            return (
              <button
                key={location}
                type="button"
                role="tab"
                aria-selected={focus === location}
                className={focus === location ? "is-active" : ""}
                onClick={() => setFocus(location)}
              >
                <strong>{mediaLocationLabels[location].name}</strong>
                <small>{filled ? "Média assigné" : "Aucun média"}</small>
              </button>
            );
          })}
        </div>

        <div className="media-editor">
          <h3>{mediaLocationLabels[focus].name}</h3>
          <p className="studio-note">{mediaLocationLabels[focus].description}</p>
          <AssetField
            id={`media-${focus}-background`} kind="image" manifest={manifest} packAbsentReason={packAbsentReason}
            label="Fond du lieu" path="media.locations[].backgroundUrl" hint="Visible derrière l’interface de ce lieu."
            value={entry.backgroundUrl ?? ""}
            onChange={(next) => onChange(updateMediaLocation(media, focus, { backgroundUrl: next }))}
          />
          <AssetField
            id={`media-${focus}-ambience`} kind="audio" manifest={manifest} packAbsentReason={packAbsentReason}
            label="Ambiance" path="media.locations[].ambienceUrl" hint="Nappe continue et discrète, jouée tant que le lieu est ouvert."
            value={entry.ambienceUrl ?? ""}
            onChange={(next) => onChange(updateMediaLocation(media, focus, { ambienceUrl: next }))}
          />
          <AssetField
            id={`media-${focus}-music`} kind="audio" manifest={manifest} packAbsentReason={packAbsentReason}
            label="Musique" path="media.locations[].musicUrl" hint="Piste identifiable, réservée aux moments forts du lieu."
            value={entry.musicUrl ?? ""}
            onChange={(next) => onChange(updateMediaLocation(media, focus, { musicUrl: next }))}
          />
          <div className="studio-inline-fields">
            <label htmlFor={`media-${focus}-bpm`}>
              <span>Tempo (bpm)</span>
              <input
                id={`media-${focus}-bpm`} type="number" min={20} max={240} value={entry.bpm ?? ""}
                onChange={(event) => onChange(updateMediaLocation(media, focus, { bpm: event.target.value ? Number(event.target.value) : undefined }))}
              />
            </label>
            <label className="studio-switch">
              <input
                type="checkbox" checked={entry.loop ?? false}
                onChange={(event) => onChange(updateMediaLocation(media, focus, { loop: event.target.checked }))}
              />
              <span>Boucler</span>
            </label>
          </div>
        </div>

        <LocationPreview location={focus} backgroundUrl={entry.backgroundUrl} manifest={manifest} />
      </div>

      <section className="media-gameover">
        <h3><Skull aria-hidden="true" /> Fin de partie</h3>
        <p className="studio-note">Ce que le joueur voit et entend lorsque la partie se termine.</p>
        <div className="studio-inline-fields">
          <AssetField
            id="media-gameover-background" kind="image" manifest={manifest} packAbsentReason={packAbsentReason}
            label="Visuel de fin" path="media.gameOver.visualUrl" value={media.gameOver?.backgroundUrl ?? ""}
            onChange={(next) => onChange(updateGameOverMedia(media, { backgroundUrl: next }))}
          />
          <AssetField
            id="media-gameover-music" kind="audio" manifest={manifest} packAbsentReason={packAbsentReason}
            label="Musique de fin" path="media.gameOver.musicUrl" value={media.gameOver?.musicUrl ?? ""}
            onChange={(next) => onChange(updateGameOverMedia(media, { musicUrl: next }))}
          />
        </div>
      </section>

      <PackBrowser manifest={manifest} packAbsentReason={packAbsentReason} />
    </div>
  );
}

/** Aperçu du lieu configuré : le fond réel derrière une maquette de l'interface. */
function LocationPreview({ location, backgroundUrl, manifest }: { location: MediaLocation; backgroundUrl?: string; manifest?: AssetPackManifest }) {
  const resolved = backgroundUrl ? resolveAssetReference(backgroundUrl, manifest) : undefined;
  const label = mediaLocationLabels[location];
  return (
    <figure className="surface-preview" aria-label={`Aperçu du lieu ${label.name}`}>
      <div className="surface-frame" style={resolved?.kind === "image" ? { backgroundImage: `url(${JSON.stringify(resolved.url).slice(1, -1)})` } : undefined}>
        <div className="surface-hud"><span /><span /><span /></div>
        <div className="surface-body">
          <p className="eyebrow">{label.name}</p>
          <strong>{location === "map" ? "Le monde et ses portes" : location === "player" ? "La scène en cours" : label.name}</strong>
          {!resolved && <small>{backgroundUrl ? "Fond non résolu : le pack n’est pas chargé ou l’asset est inconnu." : "Aucun fond assigné — le décor par défaut du client reste appliqué."}</small>}
        </div>
      </div>
      <figcaption>Aperçu du fond, dans la disposition réelle du client.</figcaption>
    </figure>
  );
}

/** Auditionner le pack, même quand le moteur n'accepte pas encore d'assignation. */
function PackBrowser({ manifest, packAbsentReason }: { manifest?: AssetPackManifest; packAbsentReason?: string }) {
  const [open, setOpen] = useState(false);
  if (!manifest) {
    return (
      <p className="studio-note">
        <Info aria-hidden="true" />
        {packAbsentReason ?? "Aucun pack d’assets n’est publié sur cette instance : seules les URLs HTTPS sont assignables."}
      </p>
    );
  }
  return (
    <details className="pack-browser" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Pack « {manifest.name} » · {manifest.assets.length} assets · {manifest.license}</summary>
      <p className="studio-note">{manifest.attribution}</p>
      {manifest.gaps.length > 0 && (
        <div className="pack-gaps">
          <h4><AlertTriangle aria-hidden="true" /> Ce que le pack déclare ne pas fournir</h4>
          <ul>{manifest.gaps.map((gap) => <li key={gap.role}><strong>{gap.role}</strong> — {gap.reason}</li>)}</ul>
        </div>
      )}
      <ul className="pack-assets">
        {manifest.assets.map((asset) => (
          <li key={asset.id}>
            <div>
              {asset.kind === "audio" ? <Music aria-hidden="true" /> : <ImageIcon aria-hidden="true" />}
              <code>{manifest.packId}:{asset.id}</code>
              <small>{asset.role}</small>
            </div>
            {open && <AssetPreview id={`pack-${asset.id}`} url={asset.path} kind={asset.kind} compact />}
          </li>
        ))}
      </ul>
    </details>
  );
}
