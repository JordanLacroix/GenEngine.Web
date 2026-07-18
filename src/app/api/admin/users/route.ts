import { NextResponse } from "next/server";
import type { PagedUsersContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function GET(request: Request) {
  try {
    const source = new URL(request.url).searchParams;
    const query = new URLSearchParams({
      page: source.get("page") ?? "1",
      pageSize: source.get("pageSize") ?? "25",
      includeDeleted: source.get("includeDeleted") ?? "false",
    });
    if (source.get("query")) query.set("query", source.get("query")!);
    return NextResponse.json(await genEngineRequest<PagedUsersContract>("identity", `/admin/users?${query}`));
  } catch (error) { return apiError(error); }
}
