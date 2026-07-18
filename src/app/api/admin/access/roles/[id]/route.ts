import { NextResponse } from "next/server";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

interface RouteContext { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await genEngineRequest<void>("identity", `/admin/access/roles/${encodeURIComponent(id)}`, { method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
