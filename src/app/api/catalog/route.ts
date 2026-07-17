import { NextResponse } from "next/server";
import { HttpGenEngineClient } from "@/shared/api/genengine-client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const client = new HttpGenEngineClient(process.env.GENENGINE_AUTHORING_URL ?? "http://localhost:5201");
  try {
    return NextResponse.json(await client.listPublishedStories(request.signal));
  } catch (error) {
    return NextResponse.json(
      { title: "catalog_unavailable", detail: error instanceof Error ? error.message : "Catalog unavailable" },
      { status: 502 },
    );
  }
}
