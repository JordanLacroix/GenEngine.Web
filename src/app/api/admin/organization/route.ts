import { NextResponse } from "next/server";
import type { OperatingPeriodContract, OrganizationFrontContract, OrganizationOperationsContract, OrganizationUnitContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

const base = "/admin/organization/default";

export async function GET() {
  try {
    const [front, periods, units, memberships, assignments] = await Promise.all([
      genEngineRequest<OrganizationFrontContract>("organization", base),
      genEngineRequest<OperatingPeriodContract[]>("organization", `${base}/periods`),
      genEngineRequest<OrganizationUnitContract[]>("organization", `${base}/units`),
      genEngineRequest<OrganizationOperationsContract["memberships"]>("organization", `${base}/memberships?pageSize=100`),
      genEngineRequest<OrganizationOperationsContract["assignments"]>("organization", `${base}/assignments?pageSize=100`),
    ]);
    return NextResponse.json({ front, periods, units, memberships, assignments } satisfies OrganizationOperationsContract);
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as Pick<OrganizationFrontContract, "name" | "type" | "isActive"> & { expectedRevision?: number };
    return NextResponse.json(await genEngineRequest<OrganizationFrontContract>("organization", base, { method: "PUT", body: JSON.stringify(body) }));
  } catch (error) { return apiError(error); }
}
