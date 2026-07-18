export interface FamiliarAssetPack {
  schemaVersion: 1;
  id: string;
  name: string;
  targetFamiliarId?: string;
  portraitUrl: string;
  backgroundUrl?: string;
  license: string;
  attribution: string;
}

const storageKey = "genengine.familiar.asset-pack";

export const bundledAsterPack: FamiliarAssetPack = {
  schemaVersion: 1,
  id: "genengine.aster.original",
  name: "Aster — constellation",
  portraitUrl: "/illustrations/familiar-aster.jpg",
  backgroundUrl: "/illustrations/intro-gateway.jpg",
  license: "GenEngine project asset — no external trademark or ownership metadata",
  attribution: "Illustration originale générée pour GenEngine",
};

export function readFamiliarAssetPack(): FamiliarAssetPack {
  if (typeof window === "undefined") return bundledAsterPack;
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return bundledAsterPack;
  try { return parseFamiliarAssetPack(stored); }
  catch { return bundledAsterPack; }
}

export function saveFamiliarAssetPack(pack: FamiliarAssetPack) {
  window.localStorage.setItem(storageKey, JSON.stringify(pack));
}

export function parseFamiliarAssetPack(source: string): FamiliarAssetPack {
  const value = JSON.parse(source) as Partial<FamiliarAssetPack>;
  if ("ownerId" in value || "ownership" in value || "tokenId" in value) {
    throw new Error("Un pack visuel ne doit contenir aucune donnée de propriété ou de jeton.");
  }
  if (value.schemaVersion !== 1 || !value.id?.trim() || !value.name?.trim() || !value.license?.trim() || !value.attribution?.trim()) {
    throw new Error("Le manifeste doit déclarer schemaVersion, id, name, license et attribution.");
  }
  if (!value.portraitUrl || !isAllowedAssetUrl(value.portraitUrl) || (value.backgroundUrl && !isAllowedAssetUrl(value.backgroundUrl))) {
    throw new Error("Les assets doivent utiliser HTTPS ou un chemin local /illustrations/.");
  }
  return value as FamiliarAssetPack;
}

function isAllowedAssetUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("/illustrations/");
}
