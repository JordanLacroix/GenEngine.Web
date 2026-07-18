import { NextResponse } from "next/server";
import { accessCookieName, genEngineRequest } from "@/shared/api/genengine-server";

interface Providers { entraAuthority?: string; entraClientId?: string }
interface AccessToken { token: string; expiresAt: string }
const verifierCookie = "genengine_entra_verifier";
const stateCookie = "genengine_entra_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const values = Object.fromEntries((request.headers.get("cookie") ?? "").split(";").map((part) => part.trim().split("=", 2)));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== values[stateCookie] || !values[verifierCookie]) {
    return NextResponse.redirect(new URL("/?auth=entra-error", request.url));
  }
  const providers = await genEngineRequest<Providers>("identity", "/auth/providers", {}, false);
  if (!providers.entraAuthority || !providers.entraClientId) return NextResponse.redirect(new URL("/?auth=entra-disabled", request.url));
  const redirectUri = new URL("/api/auth/entra/callback", request.url).toString();
  const form = new URLSearchParams({
    client_id: providers.entraClientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: values[verifierCookie],
    scope: `openid profile email api://${providers.entraClientId}/.default`,
  });
  const secret = process.env.ENTRA_CLIENT_SECRET;
  if (secret) form.set("client_secret", secret);
  const tokenResponse = await fetch(`${providers.entraAuthority}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });
  if (!tokenResponse.ok) return NextResponse.redirect(new URL("/?auth=entra-error", request.url));
  const external = await tokenResponse.json() as { access_token: string };
  const access = await genEngineRequest<AccessToken>("identity", "/auth/entra/exchange", {
    method: "POST",
    headers: { Authorization: `Bearer ${external.access_token}` },
  }, false);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(accessCookieName, access.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", expires: new Date(access.expiresAt), path: "/" });
  response.cookies.delete(verifierCookie);
  response.cookies.delete(stateCookie);
  return response;
}
