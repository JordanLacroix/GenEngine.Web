import { NextResponse } from "next/server";
import type { AdminConfigurationContract, ExperienceDocumentContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function GET() {
  try { return NextResponse.json(await genEngineRequest<AdminConfigurationContract>("configuration", "/admin/configuration/default")); }
  catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { expectedRevision: number; document: ExperienceDocumentContract };
    return NextResponse.json(await genEngineRequest<AdminConfigurationContract>("configuration", "/admin/configuration/default", { method: "PUT", body: JSON.stringify(body) }));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { expectedRevision } = await request.json() as { expectedRevision: number };
    return NextResponse.json(await genEngineRequest<AdminConfigurationContract>("configuration", "/admin/configuration/default/publish", { method: "POST", body: JSON.stringify({ expectedRevision }) }));
  } catch (error) { return apiError(error); }
}
