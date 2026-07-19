import { NextResponse } from "next/server";
import { HttpGenEngineClient } from "@/shared/api/genengine-client";
import { resolveServiceUrl } from "@/shared/api/genengine-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Une seule résolution d'URL de service dans le dépôt : celle de la façade.
  // Dupliquer la lecture d'environnement ici avait pour effet qu'une surcharge
  // de session s'appliquait partout sauf au catalogue.
  const client = new HttpGenEngineClient(await resolveServiceUrl("authoring"));
  try {
    return NextResponse.json(await client.listPublishedStories(request.signal));
  } catch (error) {
    return NextResponse.json(
      { title: "catalog_unavailable", detail: error instanceof Error ? error.message : "Catalog unavailable" },
      { status: 502 },
    );
  }
}
