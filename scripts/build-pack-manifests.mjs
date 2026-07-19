#!/usr/bin/env node
/**
 * Régénère les deux manifestes servis par le client à partir du pack d'assets
 * copié sous `public/packs/<packId>/`.
 *
 * Le pack amont (dépôt GenEngine, `assets/diapason/`) porte son propre manifeste
 * `asset-manifest.json`. Ce script le traduit vers les deux contrats que le
 * client sait lire, sans rien inventer :
 *
 * - `public/packs/manifest.json` — catalogue lu par le Studio
 *   (`src/shared/assets/asset-pack.ts`) ;
 * - `public/audio/manifest.json` — signaux sonores de l'application
 *   (`src/shared/audio/audio-contract.ts`).
 *
 * Les empreintes SHA-256 sont **recalculées depuis les fichiers copiés**, jamais
 * recopiées du manifeste amont : une copie corrompue échoue ici plutôt que dans
 * le navigateur d'un joueur.
 *
 * Aucune dépendance : `node scripts/build-pack-manifests.mjs`.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packId = "diapason-core";
const packRoot = join(root, "public", "packs", packId);
const upstream = JSON.parse(readFileSync(join(packRoot, "asset-manifest.json"), "utf8"));

if (upstream.schemaVersion !== 1) {
  throw new Error(`Manifeste amont de version non prise en charge : ${upstream.schemaVersion}.`);
}
if (upstream.packId !== packId) {
  throw new Error(`Le manifeste amont déclare « ${upstream.packId} », attendu « ${packId} ».`);
}

const attributionBySource = new Map(upstream.sources.map((source) => [source.sourceId, source.attribution]));
const licenseBySource = new Map(upstream.sources.map((source) => [source.sourceId, source.license]));

/** `image` ou `audio` : le seul axe dont le sélecteur du Studio a besoin. */
function kindOf(mediaType) {
  if (mediaType.startsWith("image/")) return "image";
  if (mediaType.startsWith("audio/")) return "audio";
  throw new Error(`Type de média non servable : ${mediaType}.`);
}

const assets = upstream.assets.map((asset) => {
  const bytes = readFileSync(join(packRoot, asset.path));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== asset.sha256) {
    throw new Error(`Empreinte divergente pour « ${asset.id} » : le fichier copié ne correspond pas au manifeste amont.`);
  }
  return {
    id: asset.id,
    kind: kindOf(asset.mediaType),
    // `usage` est la phrase que le pack destine aux auteurs : c'est elle qui
    // rend le sélecteur du Studio lisible, pas un code technique.
    role: asset.usage,
    path: `/packs/${packId}/${asset.path}`,
    sha256,
    mimeType: asset.mediaType,
    ...(asset.image ? { width: asset.image.width, height: asset.image.height } : {}),
    ...(asset.audio ? { durationSeconds: asset.audio.durationSeconds } : {}),
    license: licenseBySource.get(asset.sourceId),
    attribution: attributionBySource.get(asset.sourceId),
  };
});

const packManifest = {
  version: 1,
  packId,
  name: "Diapason — pack CC0",
  license: "CC0-1.0",
  attribution: upstream.sources.map((source) => source.attribution).join(" · "),
  assets,
  gaps: upstream.gaps.map((gap) => ({ role: gap.kind, reason: gap.reason })),
};

/**
 * Signaux de l'application vers les assets réellement livrés.
 *
 * Les cinq `ambience.*` sont **volontairement absents** : le pack déclare ne
 * fournir aucune boucle d'ambiance (`gaps`). Les déclarer avec un son court
 * serait inventer un contenu que le pack annonce ne pas avoir.
 */
const cueBindings = [
  ["signature.choice", "sfx.choice.confirm"],
  ["signature.error", "sfx.error.soft"],
  ["signature.reward", "stinger.reward.primary"],
  ["signature.door", "sfx.panel.open"],
  ["music.ending", "stinger.reward.primary"],
  ["music.gameOver", "stinger.session.end"],
];

const byId = new Map(assets.map((asset) => [asset.id, asset]));
const audioManifest = {
  version: 1,
  name: packManifest.name,
  license: packManifest.license,
  attribution: packManifest.attribution,
  entries: cueBindings.map(([cue, assetId]) => {
    const asset = byId.get(assetId);
    if (!asset) throw new Error(`Le signal « ${cue} » cible un asset absent : ${assetId}.`);
    return {
      cue,
      sources: [{ url: asset.path, mimeType: asset.mimeType }],
      license: asset.license,
      attribution: asset.attribution,
    };
  }),
};

writeFileSync(join(root, "public", "packs", "manifest.json"), `${JSON.stringify(packManifest, null, 2)}\n`);
writeFileSync(join(root, "public", "audio", "manifest.json"), `${JSON.stringify(audioManifest, null, 2)}\n`);
console.log(`${assets.length} assets · ${audioManifest.entries.length} signaux sonores.`);
