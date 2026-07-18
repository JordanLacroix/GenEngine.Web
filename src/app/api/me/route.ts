import { NextResponse } from "next/server";
import type { PlayerExperienceContract, PublishedExperienceContract, UserAccessContract, UserContextContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function GET() {
  try {
    const [access, experience, player] = await Promise.all([
      genEngineRequest<UserAccessContract>("identity", "/me"),
      genEngineRequest<PublishedExperienceContract>("configuration", "/experience/default", {}, false),
      genEngineRequest<PlayerExperienceContract>("playerExperience", "/me/experience?frontId=default"),
    ]);
    return NextResponse.json({ access, experience, player } satisfies UserContextContract);
  } catch (error) { return apiError(error); }
}
