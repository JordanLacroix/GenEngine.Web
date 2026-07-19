import { NextResponse } from "next/server";
import {
  allowedEndpointHosts, endpointConfiguration, endpointsCookieName, isEndpointOverrideEnabled,
} from "@/shared/api/genengine-server";
import { sameOriginRejection } from "@/shared/api/route-errors";
import { assertHostsAllowed, EndpointValidationError, parseEndpointOverride, serializeEndpointOverride } from "@/shared/api/service-endpoints";

export const dynamic = "force-dynamic";

/**
 * Surcharge de session des URLs de services.
 *
 * La valeur est écrite dans un cookie `HttpOnly` `SameSite=Strict` : le
 * navigateur ne la lit jamais, et une page tierce ne peut pas la poser. Les
 * mutations exigent en plus une requête de même origine — déplacer la cible
 * d'appels qui portent le JWT de la personne connectée est exactement le
 * genre d'action qu'on ne laisse pas déclencher depuis ailleurs.
 */
export async function GET() {
  return NextResponse.json(await endpointConfiguration());
}

export async function PUT(request: Request) {
  const rejection = sameOriginRejection(request);
  if (rejection) return rejection;
  if (!isEndpointOverrideEnabled()) return disabled();
  try {
    const override = parseEndpointOverride(await request.json() as unknown);
    // Le serveur n'accepte pas de relayer vers un hôte que l'exploitant n'a pas
    // déclaré : sans cela, cet écran serait un contournement de frontière réseau.
    assertHostsAllowed(override, allowedEndpointHosts());
    const response = NextResponse.json({ saved: true, override });
    response.cookies.set(endpointsCookieName, serializeEndpointOverride(override), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    if (error instanceof EndpointValidationError) {
      return NextResponse.json({ title: "invalid_endpoints", detail: error.message }, { status: 422 });
    }
    return NextResponse.json({ title: "invalid_endpoints", detail: "Configuration illisible." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const rejection = sameOriginRejection(request);
  if (rejection) return rejection;
  const response = NextResponse.json({ cleared: true });
  response.cookies.set(endpointsCookieName, "", { httpOnly: true, sameSite: "strict", maxAge: 0, path: "/" });
  return response;
}

function disabled() {
  return NextResponse.json({
    title: "endpoint_override_disabled",
    detail: "L’exploitant a désactivé la surcharge des URLs de services sur cette instance (GENENGINE_ALLOW_ENDPOINT_OVERRIDE).",
  }, { status: 403 });
}
