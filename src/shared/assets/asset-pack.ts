/**
 * Catalogue d'assets servi par l'instance.
 *
 * Le pack lui-même est produit par une autre tranche de travail (pack CC0
 * « Diapason »). Ce module ne décrit donc que ce dont la configuration a besoin :
 * un manifeste stable, une référence courte `packId:assetId` et une résolution
 * vers une URL réellement chargeable.
 *
 * Tant qu'aucun manifeste n'est publié, le catalogue est *absent* — pas vide.
 * L'interface le dit et n'accepte plus que des URLs HTTPS. Aucun catalogue n'est
 * inventé et aucune fixture ne remplace un pack manquant (invariants 4 et 14).
 */

export type AssetKind = "image" | "audio";

/** Une entrée du manifeste. Les métadonnées sont facultatives et jamais devinées. */
export interface AssetPackEntry {
  id: string;
  kind: AssetKind;
  /** Rôle éditorial déclaré par le pack, ex. « ambience », « ui.click », « background ». */
  role: string;
  /** Chemin servi par l'instance ou URL absolue. */
  path: string;
  sha256?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  license?: string;
  attribution?: string;
}

/** Manque déclaré par le pack : ce que le pack annonce ne pas fournir. */
export interface AssetPackGap {
  role: string;
  reason: string;
}

export interface AssetPackManifest {
  version: number;
  packId: string;
  name: string;
  license: string;
  attribution: string;
  assets: AssetPackEntry[];
  gaps: AssetPackGap[];
}

export const supportedAssetPackVersion = 1;

/** URL du manifeste servi par le client. */
export const assetPackManifestUrl = "/packs/manifest.json";

/** Une référence d'asset : soit une URL HTTPS absolue, soit `packId:assetId`. */
export type AssetReference =
  | { kind: "https"; url: string }
  | { kind: "pack"; packId: string; assetId: string };

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Lit une valeur saisie ou stockée. Une chaîne vide n'est pas une référence.
 * Une valeur qui n'est ni une URL HTTPS ni `packId:assetId` est rejetée plutôt
 * que réinterprétée.
 */
export function parseAssetReference(value: string): AssetReference | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (isHttpsUrl(trimmed)) return { kind: "https", url: trimmed };
  const separator = trimmed.indexOf(":");
  if (separator <= 0) return undefined;
  const packId = trimmed.slice(0, separator);
  const assetId = trimmed.slice(separator + 1);
  // Les deux segments doivent commencer par un caractère alphanumérique : cela
  // écarte `http://…`, `/chemin:relatif` et toute autre forme d'URL, qui doivent
  // être refusées plutôt que lues comme une référence de pack.
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(packId)) return undefined;
  if (!/^[a-z0-9][a-z0-9._\-/]*$/i.test(assetId)) return undefined;
  return { kind: "pack", packId, assetId };
}

export function formatAssetReference(reference: AssetReference): string {
  return reference.kind === "https" ? reference.url : `${reference.packId}:${reference.assetId}`;
}

export interface ResolvedAsset {
  /** URL réellement chargeable par le navigateur. */
  url: string;
  kind: AssetKind;
  entry?: AssetPackEntry;
}

/**
 * Résout une référence stockée. Une référence de pack sans manifeste chargé, ou
 * pointant vers un asset inconnu, ne résout rien : l'appelant doit l'afficher
 * comme non résolue au lieu de fabriquer une URL.
 */
export function resolveAssetReference(
  value: string,
  manifest: AssetPackManifest | undefined,
): ResolvedAsset | undefined {
  const reference = parseAssetReference(value);
  if (!reference) return undefined;
  if (reference.kind === "https") {
    return { url: reference.url, kind: guessKindFromUrl(reference.url) };
  }
  if (!manifest || manifest.packId !== reference.packId) return undefined;
  const entry = manifest.assets.find((asset) => asset.id === reference.assetId);
  if (!entry) return undefined;
  return { url: entry.path, kind: entry.kind, entry };
}

/**
 * Type déduit d'une URL libre. Volontairement conservateur : sans extension
 * reconnue on suppose une image, le cas d'usage majoritaire d'une URL collée
 * (illustration de scène ou de lieu). Le composant d'aperçu laisse de toute
 * façon l'opérateur constater ce qui est réellement chargé.
 */
export function guessKindFromUrl(url: string): AssetKind {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  return /\.(mp3|ogg|oga|opus|wav|m4a|aac|flac|webm)$/.test(path) ? "audio" : "image";
}

/** Valide un manifeste sans rien deviner : une structure inattendue lève. */
export function parseAssetPackManifest(raw: unknown): AssetPackManifest {
  if (typeof raw !== "object" || raw === null) throw new Error("Manifeste de pack illisible.");
  const candidate = raw as Partial<AssetPackManifest>;
  if (candidate.version !== supportedAssetPackVersion) {
    throw new Error(`Version de manifeste de pack non prise en charge : ${String(candidate.version)}.`);
  }
  if (typeof candidate.packId !== "string" || !candidate.packId) throw new Error("Manifeste de pack sans identifiant.");
  if (!Array.isArray(candidate.assets)) throw new Error("Manifeste de pack sans assets.");
  const assets = candidate.assets.map((asset) => {
    if (typeof asset?.id !== "string" || typeof asset.path !== "string") {
      throw new Error("Asset de pack sans identifiant ou sans chemin.");
    }
    if (asset.kind !== "image" && asset.kind !== "audio") {
      throw new Error(`Type d'asset inconnu pour « ${asset.id} » : ${String(asset.kind)}.`);
    }
    return { ...asset, role: typeof asset.role === "string" ? asset.role : "" };
  });
  const gaps = Array.isArray(candidate.gaps)
    ? candidate.gaps.map((gap) => {
      if (typeof gap?.role !== "string") throw new Error("Manque déclaré sans rôle.");
      return { role: gap.role, reason: typeof gap.reason === "string" ? gap.reason : "" };
    })
    : [];
  return {
    version: candidate.version,
    packId: candidate.packId,
    name: typeof candidate.name === "string" ? candidate.name : candidate.packId,
    license: typeof candidate.license === "string" ? candidate.license : "Non précisée",
    attribution: typeof candidate.attribution === "string" ? candidate.attribution : "Non précisée",
    assets,
    gaps,
  };
}

export interface AssetPackState {
  manifest?: AssetPackManifest;
  /** Renseignée uniquement lorsqu'un manifeste existe mais est inexploitable. */
  error?: string;
}

/**
 * Charge le manifeste servi par le client. L'absence de manifeste est un état
 * normal — le pack n'est pas encore publié — et laisse le catalogue absent ; un
 * manifeste présent mais invalide échoue explicitement.
 */
export async function loadAssetPack(
  url: string = assetPackManifestUrl,
  fetchImpl: typeof fetch = fetch,
): Promise<AssetPackState> {
  let response: Response;
  try {
    response = await fetchImpl(url, { cache: "no-store" });
  } catch {
    return {};
  }
  if (response.status === 404) return {};
  if (!response.ok) return { error: `Catalogue d'assets indisponible (${response.status}).` };
  try {
    return { manifest: parseAssetPackManifest(await response.json()) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Manifeste de pack invalide." };
  }
}
