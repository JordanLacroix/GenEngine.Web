import { NextResponse } from "next/server";
import type { ScenarioContract, ScenarioPreviewContract, ScenarioVersionContract, StructureReportContract, ValidationReportContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const versions = await genEngineRequest<ScenarioVersionContract[]>("authoring", `/scenarios/${encodeURIComponent(id)}/versions`);
    return NextResponse.json(versions);
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { expectedRevision: number; document: unknown };
    const scenario = await genEngineRequest<ScenarioContract>("authoring", `/scenarios/${encodeURIComponent(id)}/draft`, { method: "PUT", body: JSON.stringify(body) });
    return NextResponse.json(scenario);
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { action: "validate" | "analyze" | "preview" | "publish"; expectedRevision?: number; preview?: Record<string, unknown> };
    const base = `/scenarios/${encodeURIComponent(id)}`;
    if (body.action === "validate") return NextResponse.json(await genEngineRequest<ValidationReportContract>("authoring", `${base}/validate`, { method: "POST", body: "{}" }));
    if (body.action === "analyze") return NextResponse.json(await genEngineRequest<StructureReportContract>("authoring", `${base}/analyze`, { method: "POST", body: "{}" }));
    if (body.action === "preview") return NextResponse.json(await genEngineRequest<ScenarioPreviewContract>("authoring", `${base}/preview`, { method: "POST", body: JSON.stringify(body.preview ?? {}) }));
    return NextResponse.json(await genEngineRequest<ScenarioVersionContract>("authoring", `${base}/publish`, { method: "POST", body: JSON.stringify({ expectedRevision: body.expectedRevision }) }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const expectedRevision = new URL(request.url).searchParams.get("expectedRevision");
    await genEngineRequest<void>("authoring", `/scenarios/${encodeURIComponent(id)}?expectedRevision=${encodeURIComponent(expectedRevision ?? "0")}`, { method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
