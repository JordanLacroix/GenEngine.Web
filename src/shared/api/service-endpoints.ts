/**
 * Modèle des URLs de services GenEngine.
 *
 * Ce module est volontairement pur : ni `server-only`, ni accès au réseau, ni
 * accès aux cookies. Il est partagé entre la façade serveur — qui résout
 * l'URL réellement appelée — et l'écran de configuration, qui n'en manipule
 * qu'une représentation.
 *
 * Il ne définit **aucune** variable `NEXT_PUBLIC_` : l'invariant 9 tient, les
 * URLs restent résolues côté serveur.
 */

export const serviceIds = [
  "authoring", "play", "identity", "configuration", "playerExperience", "organization",
] as const;

export type ServiceId = (typeof serviceIds)[number];

export interface ServiceDescriptor {
  readonly id: ServiceId;
  /** Libellé affiché dans l'écran de configuration. */
  readonly label: string;
  /** Port de la convention de déploiement locale, pré-rempli en mode groupé. */
  readonly defaultPort: number;
  /** Variable d'environnement serveur qui reste la valeur par défaut. */
  readonly envVariable: string;
  /** Ce que le client cesse de pouvoir faire si ce service est injoignable. */
  readonly responsibility: string;
}

export const serviceDescriptors: readonly ServiceDescriptor[] = [
  { id: "authoring", label: "Authoring", defaultPort: 5201, envVariable: "GENENGINE_AUTHORING_URL", responsibility: "Catalogue des scénarios publiés." },
  { id: "play", label: "Play", defaultPort: 5202, envVariable: "GENENGINE_PLAY_URL", responsibility: "Sessions, transitions et arbres de quête." },
  { id: "identity", label: "Identity", defaultPort: 5203, envVariable: "GENENGINE_IDENTITY_URL", responsibility: "Connexion, comptes, rôles et permissions." },
  { id: "configuration", label: "Configuration", defaultPort: 5204, envVariable: "GENENGINE_CONFIGURATION_URL", responsibility: "Document d'expérience publié et brouillon." },
  { id: "playerExperience", label: "PlayerExperience", defaultPort: 5205, envVariable: "GENENGINE_PLAYER_EXPERIENCE_URL", responsibility: "Familier, tutoriel, journal et économie." },
  { id: "organization", label: "Organization", defaultPort: 5206, envVariable: "GENENGINE_ORGANIZATION_URL", responsibility: "Unités, périodes, appartenances et affectations." },
];

export function serviceDescriptor(id: ServiceId): ServiceDescriptor {
  const descriptor = serviceDescriptors.find((item) => item.id === id);
  if (!descriptor) throw new EndpointValidationError(`Service inconnu : ${id}.`);
  return descriptor;
}

/**
 * Deux modes, parce que deux topologies réelles existent :
 * - `grouped` : un hôte unique expose les six services sur six ports ;
 * - `unit` : chaque service vit sur sa propre machine et porte son URL entière.
 */
export type EndpointMode = "grouped" | "unit";

export interface GroupedEndpoints {
  readonly mode: "grouped";
  readonly scheme: "http" | "https";
  readonly host: string;
  readonly ports: Readonly<Record<ServiceId, number>>;
}

export interface UnitEndpoints {
  readonly mode: "unit";
  readonly urls: Readonly<Record<ServiceId, string>>;
}

export type EndpointOverride = GroupedEndpoints | UnitEndpoints;

export class EndpointValidationError extends Error {}

/** Résultat d'un test de joignabilité, exécuté côté serveur. */
export interface EndpointProbeResult {
  readonly service: ServiceId;
  readonly url: string;
  readonly reachable: boolean;
  readonly status?: number;
  readonly latencyMs: number;
  readonly detail: string;
}

/** Réponse de `GET /api/settings/endpoints`. */
export interface EndpointConfigurationContract {
  readonly overrideEnabled: boolean;
  /** Hôtes que l'exploitant accepte comme cible ; `*` lève la restriction. */
  readonly allowedHosts: readonly string[];
  readonly source: "override" | "environment";
  readonly override?: EndpointOverride;
  readonly environment: Record<ServiceId, string>;
  readonly effective: Record<ServiceId, string>;
}

export const defaultGroupedEndpoints: GroupedEndpoints = {
  mode: "grouped",
  scheme: "http",
  host: "localhost",
  ports: Object.fromEntries(
    serviceDescriptors.map((descriptor) => [descriptor.id, descriptor.defaultPort]),
  ) as Record<ServiceId, number>,
};

/**
 * Une URL de service acceptable.
 *
 * Refuse tout ce qui n'est pas `http`/`https`, tout identifiant embarqué dans
 * l'URL — un secret n'a rien à faire dans une configuration — et normalise en
 * origine plus chemin de base, sans barre finale superflue.
 */
export function normalizeServiceUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new EndpointValidationError("Une URL de service est requise.");
  let url: URL;
  try { url = new URL(trimmed); }
  catch { throw new EndpointValidationError(`URL invalide : « ${trimmed} ».`); }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new EndpointValidationError(`Seuls http et https sont acceptés : « ${trimmed} ».`);
  }
  if (url.username || url.password) {
    throw new EndpointValidationError("Une URL de service ne porte pas d’identifiants.");
  }
  if (!url.hostname) throw new EndpointValidationError(`Hôte manquant dans « ${trimmed} ».`);
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}

function normalizeHost(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new EndpointValidationError("L’hôte commun est requis.");
  if (/[\s/\\?#@]/.test(trimmed)) {
    throw new EndpointValidationError(`Hôte invalide : « ${trimmed} ». Indiquez seulement un nom ou une adresse.`);
  }
  return trimmed;
}

function normalizePort(raw: unknown, service: ServiceId): number {
  const port = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new EndpointValidationError(`Port invalide pour ${serviceDescriptor(service).label} : « ${String(raw)} ».`);
  }
  return port;
}

/**
 * Hôtes vers lesquels une surcharge de session peut pointer.
 *
 * Sans cette barrière, l'écran de configuration donnerait à n'importe quel
 * visiteur le pouvoir de faire émettre au serveur une requête vers l'hôte de
 * son choix — un contournement de frontière réseau (CWE-918), et un scanner de
 * ports pour tout ce que le serveur peut joindre et pas lui.
 *
 * Défaut : la convention de déploiement local. `*` lève la restriction et doit
 * rester un choix explicite de l'exploitant.
 */
export const defaultAllowedHosts: readonly string[] = [
  "localhost", "127.0.0.1", "::1", "host.docker.internal",
];

export function parseAllowedHosts(raw: string | undefined): readonly string[] {
  const declared = (raw ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return declared.length > 0 ? declared : defaultAllowedHosts;
}

export function isHostAllowed(host: string, allowed: readonly string[]): boolean {
  if (allowed.includes("*")) return true;
  // `new URL` conserve les crochets d'une adresse IPv6 littérale.
  const normalized = host.trim().toLowerCase().replace(/^\[|\]$/g, "");
  return allowed.some((candidate) => candidate === normalized);
}

/**
 * Rejette une surcharge dont un seul hôte sortirait de la liste autorisée.
 *
 * Tout ou rien : une configuration à moitié appliquée enverrait une partie des
 * appels ailleurs que ce que l'écran affiche.
 */
export function assertHostsAllowed(override: EndpointOverride, allowed: readonly string[]): void {
  for (const id of serviceIds) {
    const host = new URL(endpointUrl(override, id)).hostname;
    if (!isHostAllowed(host, allowed)) {
      throw new EndpointValidationError(
        `L’hôte « ${host} » n’est pas autorisé par l’exploitant. `
        + `Hôtes acceptés : ${allowed.join(", ")} (GENENGINE_ENDPOINT_ALLOWED_HOSTS).`,
      );
    }
  }
}

/** L'URL réellement appelée pour un service, quel que soit le mode. */
export function endpointUrl(override: EndpointOverride, service: ServiceId): string {
  if (override.mode === "unit") return override.urls[service];
  return `${override.scheme}://${override.host}:${override.ports[service]}`;
}

/** Toutes les URLs effectives, dans l'ordre des descripteurs. */
export function endpointUrls(override: EndpointOverride): Record<ServiceId, string> {
  return Object.fromEntries(
    serviceIds.map((id) => [id, endpointUrl(override, id)]),
  ) as Record<ServiceId, string>;
}

/**
 * Valide une saisie et la ramène à une forme canonique.
 *
 * Échoue explicitement plutôt que d'interpréter : une configuration à moitié
 * comprise vaut moins qu'un refus lisible (invariant 14).
 */
export function parseEndpointOverride(raw: unknown): EndpointOverride {
  if (typeof raw !== "object" || raw === null) {
    throw new EndpointValidationError("Configuration illisible.");
  }
  const value = raw as Record<string, unknown>;
  if (value.mode === "unit") {
    const source = value.urls;
    if (typeof source !== "object" || source === null) {
      throw new EndpointValidationError("Le mode unitaire attend une URL par service.");
    }
    const urls = source as Record<string, unknown>;
    const normalized = {} as Record<ServiceId, string>;
    for (const id of serviceIds) {
      const candidate = urls[id];
      if (typeof candidate !== "string") {
        throw new EndpointValidationError(`URL manquante pour ${serviceDescriptor(id).label}.`);
      }
      normalized[id] = normalizeServiceUrl(candidate);
    }
    return { mode: "unit", urls: normalized };
  }
  if (value.mode === "grouped") {
    const scheme = value.scheme === "https" ? "https" : value.scheme === "http" ? "http" : undefined;
    if (!scheme) throw new EndpointValidationError("Le schéma doit valoir http ou https.");
    const source = value.ports;
    if (typeof source !== "object" || source === null) {
      throw new EndpointValidationError("Le mode groupé attend un port par service.");
    }
    const ports = source as Record<string, unknown>;
    const normalized = {} as Record<ServiceId, number>;
    for (const id of serviceIds) normalized[id] = normalizePort(ports[id], id);
    return { mode: "grouped", scheme, host: normalizeHost(String(value.host ?? "")), ports: normalized };
  }
  throw new EndpointValidationError("Mode inconnu : attendu « grouped » ou « unit ».");
}

export function serializeEndpointOverride(override: EndpointOverride): string {
  return JSON.stringify(override);
}

/** Lit une valeur persistée, en refusant silencieusement ce qui est illisible. */
export function readEndpointOverride(raw: string | undefined): EndpointOverride | undefined {
  if (!raw) return undefined;
  try { return parseEndpointOverride(JSON.parse(raw) as unknown); }
  catch { return undefined; }
}
