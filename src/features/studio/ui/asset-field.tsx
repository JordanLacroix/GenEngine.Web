"use client";

import { AlertTriangle, Image as ImageIcon, Link2, Music, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type AssetKind, type AssetPackManifest, type AssetPackState, loadAssetPack, parseAssetReference,
  resolveAssetReference,
} from "@/shared/assets/asset-pack";

/**
 * Champ d'assignation d'un média.
 *
 * Deux sources sont possibles, exactement celles que le moteur accepte : un
 * asset du pack publié (`packId:assetId`) ou une URL HTTPS absolue. Quand aucun
 * manifeste n'est servi, le catalogue est annoncé absent et seule l'URL reste
 * saisissable : aucun catalogue n'est fabriqué.
 */

export function useAssetPack(): AssetPackState & { loading: boolean } {
  const [state, setState] = useState<AssetPackState & { loading: boolean }>({ loading: true });
  useEffect(() => {
    let cancelled = false;
    void loadAssetPack().then((value) => { if (!cancelled) setState({ ...value, loading: false }); });
    return () => { cancelled = true; };
  }, []);
  return state;
}

/** Un seul aperçu sonore à la fois : en démarrer un arrête le précédent. */
let currentPreview: HTMLAudioElement | undefined;
let currentPreviewOwner: string | undefined;

export function stopAssetPreview() {
  currentPreview?.pause();
  currentPreview = undefined;
  currentPreviewOwner = undefined;
}

export function AssetField({
  label, hint, value, onChange, kind, manifest, packAbsentReason, id,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  kind: AssetKind;
  manifest?: AssetPackManifest;
  packAbsentReason?: string;
  id: string;
}) {
  const reference = parseAssetReference(value);
  const resolved = resolveAssetReference(value, manifest);
  const candidates = manifest?.assets.filter((asset) => asset.kind === kind) ?? [];
  const unresolvedPack = Boolean(reference && reference.kind === "pack" && !resolved);

  return (
    <div className="asset-field">
      <div className="asset-field-head">
        <label htmlFor={`${id}-url`}>{kind === "audio" ? <Music aria-hidden="true" /> : <ImageIcon aria-hidden="true" />}{label}</label>
        {value && <button type="button" className="asset-clear" onClick={() => onChange("")}>Retirer</button>}
      </div>
      {hint && <p className="asset-hint">{hint}</p>}
      {candidates.length > 0 && (
        <label className="asset-pack-picker" htmlFor={`${id}-pack`}>
          <span className="sr-only">Choisir dans le pack {manifest?.name}</span>
          <select
            id={`${id}-pack`}
            value={reference?.kind === "pack" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">Choisir dans « {manifest?.name} »…</option>
            {candidates.map((asset) => (
              <option key={asset.id} value={`${manifest?.packId}:${asset.id}`}>
                {asset.id}{asset.role ? ` · ${asset.role}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="asset-url" htmlFor={`${id}-url`}>
        <Link2 aria-hidden="true" />
        <input
          id={`${id}-url`}
          value={value}
          spellCheck={false}
          placeholder={candidates.length > 0 ? "…ou une URL HTTPS, ou packId:assetId" : "URL HTTPS absolue"}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {!manifest && packAbsentReason && <p className="asset-notice"><AlertTriangle aria-hidden="true" />{packAbsentReason}</p>}
      {unresolvedPack && (
        <p className="asset-notice is-warning" role="status">
          <AlertTriangle aria-hidden="true" />
          Référence de pack non résolue : aucun asset « {reference?.kind === "pack" ? reference.assetId : ""} » dans le manifeste chargé. La valeur est conservée telle quelle et sera envoyée au moteur.
        </p>
      )}
      {value && !reference && (
        <p className="asset-notice is-warning" role="status">
          <AlertTriangle aria-hidden="true" />
          Ni URL HTTPS ni référence <code>packId:assetId</code>. Le moteur refusera probablement cette valeur.
        </p>
      )}
      {resolved && <AssetPreview id={id} url={resolved.url} kind={resolved.kind} attribution={resolved.entry?.attribution ?? resolved.entry?.license} />}
    </div>
  );
}

/** Aperçu réel de l'asset : on écoute ou on voit ce qui est assigné. */
export function AssetPreview({ id, url, kind, attribution, compact }: { id: string; url: string; kind: AssetKind; attribution?: string; compact?: boolean }) {
  const [playing, setPlaying] = useState(false);
  // L'échec est mémorisé avec l'URL concernée : changer d'asset repart d'un état
  // neutre sans effet de réinitialisation.
  const [failure, setFailure] = useState<{ url: string; message: string }>();
  const failed = failure?.url === url ? failure.message : undefined;
  const setFailed = (message: string) => setFailure({ url, message });

  useEffect(() => () => { if (currentPreviewOwner === id) stopAssetPreview(); }, [id]);

  if (kind === "image") {
    return (
      <figure className={compact ? "asset-preview is-compact" : "asset-preview"}>
        {failed
          ? <p className="asset-notice is-warning"><AlertTriangle aria-hidden="true" />{failed}</p>
          : <img src={url} alt="" onError={() => setFailed("Ce visuel n’a pas pu être chargé depuis cette adresse.")} />}
        {attribution && <figcaption>{attribution}</figcaption>}
      </figure>
    );
  }

  function toggle() {
    if (playing) { stopAssetPreview(); setPlaying(false); return; }
    stopAssetPreview();
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.addEventListener("ended", () => setPlaying(false));
    audio.addEventListener("error", () => { setFailed("Ce son n’a pas pu être lu depuis cette adresse."); setPlaying(false); });
    currentPreview = audio;
    currentPreviewOwner = id;
    void audio.play().then(() => setPlaying(true)).catch(() => setFailed("Ce son n’a pas pu être lu depuis cette adresse."));
  }

  return (
    <div className={compact ? "asset-preview is-audio is-compact" : "asset-preview is-audio"}>
      <button type="button" className="asset-play" onClick={toggle} aria-pressed={playing}>
        {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        {playing ? "Arrêter l’écoute" : "Écouter"}
      </button>
      <span className="asset-preview-source"><Volume2 aria-hidden="true" />{attribution ?? url}</span>
      {failed && <p className="asset-notice is-warning" role="status"><AlertTriangle aria-hidden="true" />{failed}</p>}
    </div>
  );
}
