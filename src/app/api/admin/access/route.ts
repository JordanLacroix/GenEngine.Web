import { NextResponse } from "next/server";
import type { PermissionContract, RoleContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function GET() {
  try {
    const [roles, permissions] = await Promise.all([
      genEngineRequest<RoleContract[]>("identity", "/admin/access/roles"),
      genEngineRequest<PermissionContract[]>("identity", "/admin/access/permissions"),
    ]);
    return NextResponse.json({ roles, permissions });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name: string; description: string; permissions: string[] };
    return NextResponse.json(await genEngineRequest<RoleContract>("identity", "/admin/access/roles", { method: "POST", body: JSON.stringify(body) }), { status: 201 });
  } catch (error) { return apiError(error); }
}
