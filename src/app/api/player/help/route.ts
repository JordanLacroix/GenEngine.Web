import { NextResponse } from "next/server";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    return NextResponse.json(await genEngineRequest("playerExperience", "/me/experience/assistant/contextual-help?frontId=default", { method: "POST", body: JSON.stringify(await request.json()) }));
  } catch (error) { return apiError(error); }
}
