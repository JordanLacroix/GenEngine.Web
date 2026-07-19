import { NextResponse } from "next/server";
import type { ScenarioStructureContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

interface RouteContext { params: Promise<{ id: string }> }

/**
 * Topology of a published scenario version, without any session.
 *
 * Play applies the same authorisation as starting a session: an unassigned
 * player receives 422 `content_not_assigned` and an anonymous caller 401. Those
 * statuses are relayed as-is by `apiError`; the client never softens them.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const structure = await genEngineRequest<ScenarioStructureContract>("play", `/scenario-versions/${encodeURIComponent(id)}/tree`);
    return NextResponse.json(structure);
  } catch (error) { return apiError(error); }
}
