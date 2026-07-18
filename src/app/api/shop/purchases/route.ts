import { NextResponse } from "next/server";
import type { PlayerExperienceContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    return NextResponse.json(await genEngineRequest<PlayerExperienceContract>(
      "playerExperience",
      "/me/experience/shop/purchases?frontId=default",
      { method: "POST", body: JSON.stringify(await request.json()) },
    ));
  } catch (error) { return apiError(error); }
}
