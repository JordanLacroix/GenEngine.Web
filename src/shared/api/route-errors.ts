import { NextResponse } from "next/server";
import { GenEngineServerError } from "@/shared/api/genengine-server";

export function apiError(error: unknown) {
  if (error instanceof GenEngineServerError) {
    return NextResponse.json(
      { title: error.problem?.title ?? "genengine_error", detail: error.message, status: error.status },
      { status: error.status },
    );
  }
  return NextResponse.json({ title: "gateway_error", detail: error instanceof Error ? error.message : "Service unavailable" }, { status: 502 });
}

/**
 * Refus des mutations déclenchées depuis une autre origine.
 *
 * `Sec-Fetch-Site` est envoyé par tout navigateur qui sait faire `fetch`. Son
 * absence désigne un client qui n'est pas un navigateur : il n'a pas de cookie
 * ambiant à détourner, la requête passe.
 */
export function sameOriginRejection(request: Request) {
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json(
      { title: "cross_origin_refused", detail: "Requête refusée : origine différente." },
      { status: 403 },
    );
  }
  return undefined;
}
