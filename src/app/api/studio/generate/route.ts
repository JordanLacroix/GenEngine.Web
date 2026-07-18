import { NextResponse } from "next/server";
import type { ScenarioContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { categoryId: string; prompt: string; provider: string; targetMinutes: number; tone: string };
    const scenario = await genEngineRequest<ScenarioContract>("authoring", "/scenarios/generate", {
      method: "POST",
      body: JSON.stringify({ ...body, frontId: "default" }),
    });
    return NextResponse.json(scenario, { status: 201 });
  } catch (error) { return apiError(error); }
}
