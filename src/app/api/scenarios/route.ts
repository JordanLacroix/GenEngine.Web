import { NextResponse } from "next/server";
import type { PagedScenariosContract, ScenarioContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    const { document } = await request.json() as { document: unknown };
    const scenario = await genEngineRequest<ScenarioContract>("authoring", "/scenarios/import", { method: "POST", body: JSON.stringify(document) });
    return NextResponse.json(scenario, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function GET(request: Request) {
  try {
    const source = new URL(request.url).searchParams;
    const query = new URLSearchParams({ page: source.get("page") ?? "1", pageSize: source.get("pageSize") ?? "25" });
    if (source.get("query")) query.set("query", source.get("query")!);
    if (source.get("categoryId")) query.set("categoryId", source.get("categoryId")!);
    return NextResponse.json(await genEngineRequest<PagedScenariosContract>("authoring", `/scenarios?${query}`));
  } catch (error) { return apiError(error); }
}
