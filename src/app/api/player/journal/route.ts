import { NextResponse } from "next/server";
import type { JournalContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    query.set("frontId", "default");
    return NextResponse.json(await genEngineRequest<JournalContract>("playerExperience", `/me/experience/journal?${query}`));
  } catch (error) { return apiError(error); }
}
