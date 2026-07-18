import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

interface Providers { entraEnabled: boolean; entraAuthority?: string; entraClientId?: string }
const verifierCookie = "genengine_entra_verifier";
const stateCookie = "genengine_entra_state";

export async function GET(request: Request) {
  try {
    const providers = await genEngineRequest<Providers>("identity", "/auth/providers", {}, false);
    if (!providers.entraEnabled || !providers.entraAuthority || !providers.entraClientId) {
      return NextResponse.json({ title: "provider_disabled", detail: "Microsoft Entra ID n’est pas activé." }, { status: 404 });
    }
    const verifier = randomBytes(48).toString("base64url");
    const state = randomBytes(24).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const redirectUri = new URL("/api/auth/entra/callback", request.url).toString();
    const authorize = new URL(`${providers.entraAuthority}/oauth2/v2.0/authorize`);
    authorize.search = new URLSearchParams({
      client_id: providers.entraClientId,
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: `openid profile email api://${providers.entraClientId}/.default`,
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    }).toString();
    const response = NextResponse.redirect(authorize);
    const cookie = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/api/auth/entra" };
    response.cookies.set(verifierCookie, verifier, cookie);
    response.cookies.set(stateCookie, state, cookie);
    return response;
  } catch (error) { return apiError(error); }
}
