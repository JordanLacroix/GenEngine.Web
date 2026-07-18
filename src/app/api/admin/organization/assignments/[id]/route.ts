import { NextResponse } from "next/server";
import type { ContentAssignmentContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; return NextResponse.json(await genEngineRequest<ContentAssignmentContract>("organization", `/admin/organization/default/assignments/${id}`, { method: "PUT", body: JSON.stringify(await request.json()) })); }
  catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; await genEngineRequest<void>("organization", `/admin/organization/default/assignments/${id}`, { method: "DELETE" }); return new NextResponse(null, { status: 204 }); }
  catch (error) { return apiError(error); }
}
