import { NextResponse } from "next/server";
import type { SessionContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { scenarioVersionId: string; seed: string };
    const session = await genEngineRequest<SessionContract>("play", "/sessions", {
      method: "POST",
      body: JSON.stringify({ scenarioVersionId: body.scenarioVersionId, seed: Number(body.seed) }),
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) { return apiError(error); }
}
