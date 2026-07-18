import { NextResponse } from "next/server";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { userId: string; roleId: string; scope?: string; expiresAt?: string };
    await genEngineRequest<void>("identity", `/admin/access/users/${encodeURIComponent(body.userId)}/roles`, {
      method: "POST",
      body: JSON.stringify({ roleId: body.roleId, scope: body.scope || null, expiresAt: body.expiresAt || null }),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
