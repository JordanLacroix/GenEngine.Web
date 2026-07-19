import { NextResponse } from "next/server";
import { HttpGenEngineClient, maximumVersionLookups, type StoryPage } from "@/shared/api/genengine-client";
import { clampPage, clampPageSize, readPositiveInteger } from "@/shared/api/pagination";

export const dynamic = "force-dynamic";

/**
 * Façade du catalogue publié.
 *
 * Relaie la convention de pagination du backend sans la réécrire : `page`
 * (base 1), `pageSize` (borné à 100), `query` (recherche **serveur**) et
 * `categoryId`. La réponse garde l'enveloppe `{ items, page, pageSize, total }`,
 * `items` portant des `StorySummary` déjà adaptés à la présentation.
 *
 * Deux modes particuliers, tous deux destinés à éviter qu'un navigateur
 * télécharge le catalogue entier :
 * - `versionIds` : résout quelques histoires par identifiant de version, en un
 *   seul balayage serveur, pour les écrans qui n'ont besoin que de leurs titres ;
 * - `all=1` : parcourt toutes les pages côté serveur, pour la carte des passages
 *   qui doit classer l'intégralité du catalogue par catégorie avant d'afficher
 *   une porte.
 */
export async function GET(request: Request) {
  const client = new HttpGenEngineClient(process.env.GENENGINE_AUTHORING_URL ?? "http://localhost:5201");
  const parameters = new URL(request.url).searchParams;
  try {
    const versionIds = (parameters.get("versionIds") ?? "")
      .split(",").map((value) => value.trim()).filter(Boolean).slice(0, maximumVersionLookups);
    if (parameters.has("versionIds")) {
      const stories = await client.findStoriesByVersionIds(versionIds, request.signal);
      const resolved: StoryPage = { items: stories, page: 1, pageSize: stories.length, total: stories.length };
      return NextResponse.json(resolved);
    }
    if (parameters.get("all") === "1") {
      return NextResponse.json(await client.listWholeCatalog(request.signal));
    }
    return NextResponse.json(await client.listPublishedStories({
      page: clampPage(readPositiveInteger(parameters.get("page"))),
      pageSize: clampPageSize(readPositiveInteger(parameters.get("pageSize"))),
      query: parameters.get("query") ?? undefined,
      categoryId: parameters.get("categoryId") ?? undefined,
    }, request.signal));
  } catch (error) {
    return NextResponse.json(
      { title: "catalog_unavailable", detail: error instanceof Error ? error.message : "Catalog unavailable" },
      { status: 502 },
    );
  }
}
