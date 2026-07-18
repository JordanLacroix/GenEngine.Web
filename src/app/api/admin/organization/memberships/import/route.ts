import { NextResponse } from "next/server";
import type { MembershipImportContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    return NextResponse.json(await genEngineRequest<MembershipImportContract>("organization", "/admin/organization/default/memberships/import", { method: "POST", body: JSON.stringify(await request.json()) }));
  } catch (error) { return apiError(error); }
}
