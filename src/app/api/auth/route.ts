import { NextResponse } from "next/server";
import { accessCookieName, genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

interface AuthBody { mode: "login" | "register"; userName: string; password: string }
interface AccessToken { token: string; expiresAt: string; tokenType: string }

export async function POST(request: Request) {
  try {
    const body = await request.json() as AuthBody;
    if (body.mode === "register") {
      await genEngineRequest("identity", "/auth/register", { method: "POST", body: JSON.stringify({ userName: body.userName, password: body.password }) }, false);
    }
    const access = await genEngineRequest<AccessToken>("identity", "/auth/login", {
      method: "POST",
      body: JSON.stringify({ userName: body.userName, password: body.password }),
    }, false);
    const response = NextResponse.json({ expiresAt: access.expiresAt });
    response.cookies.set(accessCookieName, access.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(access.expiresAt),
      path: "/",
    });
    return response;
  } catch (error) { return apiError(error); }
}

export async function DELETE() {
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(accessCookieName, "", { httpOnly: true, sameSite: "lax", maxAge: 0, path: "/" });
  return response;
}
