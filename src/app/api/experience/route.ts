import { NextResponse } from "next/server";
import type { PublishedExperienceContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function GET() {
  try {
    return NextResponse.json(await genEngineRequest<PublishedExperienceContract>("configuration", "/experience/default", {}, false));
  } catch (error) { return apiError(error); }
}
