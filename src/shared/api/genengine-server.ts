import "server-only";
import { cookies } from "next/headers";

export const accessCookieName = "genengine_access";

type Service = "identity" | "authoring" | "play" | "configuration" | "playerExperience" | "organization";

function serviceUrl(service: Service) {
  if (service === "identity") return process.env.GENENGINE_IDENTITY_URL ?? "http://localhost:5203";
  if (service === "play") return process.env.GENENGINE_PLAY_URL ?? "http://localhost:5202";
  if (service === "configuration") return process.env.GENENGINE_CONFIGURATION_URL ?? "http://localhost:5204";
  if (service === "playerExperience") return process.env.GENENGINE_PLAYER_EXPERIENCE_URL ?? "http://localhost:5205";
  if (service === "organization") return process.env.GENENGINE_ORGANIZATION_URL ?? "http://localhost:5206";
  return process.env.GENENGINE_AUTHORING_URL ?? "http://localhost:5201";
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
  const response = await fetch(new URL(path, serviceUrl(service)), { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const problem = await response.json().catch(() => undefined) as { title?: string; detail?: string } | undefined;
    throw new GenEngineServerError(response.status, problem);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export class GenEngineServerError extends Error {
  public constructor(public readonly status: number, public readonly problem?: { title?: string; detail?: string }) {
    super(problem?.detail ?? problem?.title ?? `GenEngine API returned ${status}`);
  }
}
