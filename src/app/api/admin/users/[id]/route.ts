import { NextResponse } from "next/server";
import type { AdminUserContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { isActive: boolean };
    return NextResponse.json(await genEngineRequest<AdminUserContract>("identity", `/admin/users/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify(body) }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await genEngineRequest<void>("identity", `/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
