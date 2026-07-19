import { NextResponse } from "next/server";
import { allowedEndpointHosts, environmentEndpoints, isEndpointOverrideEnabled } from "@/shared/api/genengine-server";
import { sameOriginRejection } from "@/shared/api/route-errors";
import {
  allowedHostFor, assertHostsAllowed, type EndpointProbeResult, EndpointValidationError,
  endpointUrl, parseEndpointOverride, type ServiceId, serviceDescriptor, serviceIds,
} from "@/shared/api/service-endpoints";

export const dynamic = "force-dynamic";

const probeTimeoutMs = 4_000;

/**
 * Test de joignabilité d'un service, exécuté **depuis le serveur** — c'est lui
 * qui appellera réellement le moteur, pas le navigateur.
 *
 * Le test ne prouve pas qu'il s'agit d'un service GenEngine : il prouve qu'un
 * serveur HTTP répond à cette adresse. Une réponse 404 compte donc comme
 * joignable, et le détail le dit plutôt que de laisser croire à une validation
 * de contrat.
 */
export async function POST(request: Request) {
  const rejection = sameOriginRejection(request);
  if (rejection) return rejection;
  let body: { service?: unknown; override?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return NextResponse.json({ title: "invalid_request", detail: "Corps illisible." }, { status: 400 }); }

  const service = body.service;
  if (typeof service !== "string" || !(serviceIds as readonly string[]).includes(service)) {
    return NextResponse.json({ title: "invalid_request", detail: "Service inconnu." }, { status: 400 });
  }

  let base: string;
  try {
    // On teste ce que la personne vient de saisir, pas ce qui est enregistré :
    // sinon il faudrait enregistrer une URL fausse pour découvrir qu'elle l'est.
    if (body.override !== undefined && isEndpointOverrideEnabled()) {
      const candidate = parseEndpointOverride(body.override);
      // Tester une adresse, c'est déjà faire émettre une requête au serveur :
      // la sonde subit exactement la même barrière que l'enregistrement.
      assertHostsAllowed(candidate, allowedEndpointHosts());
      base = endpointUrl(candidate, service as ServiceId);
    } else {
      base = endpointUrl(environmentEndpoints(), service as ServiceId);
    }
  } catch (error) {
    const detail = error instanceof EndpointValidationError ? error.message : "Configuration illisible.";
    return NextResponse.json({ title: "invalid_endpoints", detail }, { status: 422 });
  }

  return NextResponse.json(await probe(service as ServiceId, base));
}

async function probe(service: ServiceId, base: string): Promise<EndpointProbeResult> {
  // Même principe que `resolveServiceUrl` : l'adresse sondée est recomposée à
  // partir de l'hôte déclaré par l'exploitant, jamais de la chaîne reçue.
  const requested = new URL(base);
  const host = allowedHostFor(requested.hostname, allowedEndpointHosts());
  if (host === undefined) {
    return { service, url: base, reachable: false, latencyMs: 0, detail: "Hôte non autorisé par l’exploitant." };
  }
  const scheme = requested.protocol === "https:" ? "https" : "http";
  const port = Number.parseInt(requested.port, 10);
  const origin = Number.isInteger(port) && port >= 1 && port <= 65_535
    ? `${scheme}://${host}:${port}`
    : `${scheme}://${host}`;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), probeTimeoutMs);
  try {
    const response = await fetch(new URL("/health", origin), {
      signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" },
    });
    const latencyMs = Date.now() - started;
    return {
      service, url: origin, reachable: true, status: response.status, latencyMs,
      detail: response.ok
        ? `${serviceDescriptor(service).label} répond ${response.status} sur /health.`
        : `Un serveur répond ${response.status} sur /health : l’adresse est joignable, mais ce n’est peut-être pas ${serviceDescriptor(service).label}.`,
    };
  } catch (error) {
    return {
      service, url: origin, reachable: false, latencyMs: Date.now() - started,
      detail: controller.signal.aborted
        ? `Aucune réponse en ${probeTimeoutMs / 1000} s.`
        : error instanceof Error ? error.message : "Connexion impossible.",
    };
  } finally { clearTimeout(timer); }
}
