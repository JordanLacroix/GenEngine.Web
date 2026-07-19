import "server-only";
import { cookies } from "next/headers";
import {
  type EndpointOverride, endpointUrl, endpointUrls, readEndpointOverride,
  type ServiceId, serviceDescriptors, serviceIds,
} from "@/shared/api/service-endpoints";

export const accessCookieName = "genengine_access";

/**
 * Surcharge d'URLs de services propre à la session du navigateur.
 *
 * Le cookie est `HttpOnly` : la page de configuration ne le lit ni ne l'écrit
 * elle-même, elle passe par `/api/settings/endpoints`. Les URLs restent donc
 * résolues **côté serveur**, à chaque requête, sans variable `NEXT_PUBLIC_`
 * (invariant 9). Ce n'est pas une configuration d'instance : elle ne vaut que
 * pour ce navigateur, et l'environnement du serveur reste le défaut.
 */
export const endpointsCookieName = "genengine_endpoints";

type Service = ServiceId;

/**
 * La surcharge par session est-elle acceptée par l'exploitant ?
 *
 * Défaut : activée hors production, désactivée en production. Motif : une
 * surcharge acceptée en production déplacerait la cible d'appels portant le
 * JWT de la personne connectée ; ce n'est pas un réglage à laisser ouvert par
 * défaut sur une instance publique. `GENENGINE_ALLOW_ENDPOINT_OVERRIDE`
 * (`true` / `false`) tranche explicitement.
 *
 * Comportement désactivé : l'écran de configuration reste consultable et
 * annonce les URLs effectives en lecture seule ; l'enregistrement répond 403.
 */
export function isEndpointOverrideEnabled(): boolean {
  const raw = process.env.GENENGINE_ALLOW_ENDPOINT_OVERRIDE?.trim().toLowerCase();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/** Les URLs déclarées par l'environnement du serveur : la référence par défaut. */
export function environmentEndpoints(): EndpointOverride {
  const urls = Object.fromEntries(serviceDescriptors.map((descriptor) => [
    descriptor.id,
    process.env[descriptor.envVariable] ?? `http://localhost:${descriptor.defaultPort}`,
  ])) as Record<ServiceId, string>;
  return { mode: "unit", urls };
}

async function sessionOverride(): Promise<EndpointOverride | undefined> {
  if (!isEndpointOverrideEnabled()) return undefined;
  return readEndpointOverride((await cookies()).get(endpointsCookieName)?.value);
}

/** État complet de la résolution, pour l'écran de configuration. */
export async function endpointConfiguration(): Promise<{
  overrideEnabled: boolean;
  source: "override" | "environment";
  override?: EndpointOverride;
  environment: Record<ServiceId, string>;
  effective: Record<ServiceId, string>;
}> {
  const environment = environmentEndpoints();
  const override = await sessionOverride();
  return {
    overrideEnabled: isEndpointOverrideEnabled(),
    source: override ? "override" : "environment",
    override,
    environment: endpointUrls(environment),
    effective: endpointUrls(override ?? environment),
  };
}

/** L'URL réellement appelée pour un service, surcharge de session comprise. */
export async function resolveServiceUrl(service: Service): Promise<string> {
  const override = await sessionOverride();
  return endpointUrl(override ?? environmentEndpoints(), service);
}

/**
 * Présence d'une session côté serveur.
 *
 * Sert uniquement à adapter la présentation — masquer la démonstration à une
 * personne déjà connectée. Ce n'est pas un contrôle d'accès : chaque service
 * reste seul juge de ses autorisations (invariant 10).
 */
export async function isAuthenticated(): Promise<boolean> {
  return Boolean((await cookies()).get(accessCookieName)?.value);
}

export async function genEngineRequest<T>(
  service: Service,
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (authenticated) {
    const token = (await cookies()).get(accessCookieName)?.value;
    if (!token) throw new GenEngineServerError(401, { title: "authentication_required", detail: "Connectez-vous pour jouer." });
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(new URL(path, await resolveServiceUrl(service)), { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const problem = await response.json().catch(() => undefined) as { title?: string; detail?: string } | undefined;
    throw new GenEngineServerError(response.status, problem);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export { serviceIds };

export class GenEngineServerError extends Error {
  public constructor(public readonly status: number, public readonly problem?: { title?: string; detail?: string }) {
    super(problem?.detail ?? problem?.title ?? `GenEngine API returned ${status}`);
  }
}
