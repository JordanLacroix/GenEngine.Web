import { NextResponse } from "next/server";
import type { OperatingPeriodContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return NextResponse.json(await genEngineRequest<OperatingPeriodContract>("organization", `/admin/organization/default/periods/${id}`, { method: "PUT", body: JSON.stringify(await request.json()) }));
  } catch (error) { return apiError(error); }
}
