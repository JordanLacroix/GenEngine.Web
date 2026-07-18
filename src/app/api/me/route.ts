import { NextResponse } from "next/server";
import type { PlayerBootstrapContract, PublishedExperienceContract, UserAccessContract, UserContextContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function GET() {
  try {
    const [access, experience, bootstrap] = await Promise.all([
      genEngineRequest<UserAccessContract>("identity", "/me"),
      genEngineRequest<PublishedExperienceContract>("configuration", "/experience/default", {}, false),
      genEngineRequest<PlayerBootstrapContract>("playerExperience", "/me/experience/bootstrap?frontId=default"),
    ]);
    return NextResponse.json({ access, experience, player: bootstrap.experience, bootstrap } satisfies UserContextContract & { bootstrap: PlayerBootstrapContract });
  } catch (error) { return apiError(error); }
}
