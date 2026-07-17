import { NextResponse } from "next/server";
import type { ScenarioContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    const { document } = await request.json() as { document: unknown };
    const scenario = await genEngineRequest<ScenarioContract>("authoring", "/scenarios/import", { method: "POST", body: JSON.stringify(document) });
    return NextResponse.json(scenario, { status: 201 });
  } catch (error) { return apiError(error); }
}
