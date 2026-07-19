import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpGenEngineClient } from "@/shared/api/genengine-client";

/**
 * Tests écrits **contre le contrat documenté** de la PR backend #55, non contre
 * un backend en fonctionnement : la route paginée n'est pas fusionnée. Ils
 * prouvent la façon dont ce client décode et parcourt l'enveloppe, pas que le
 * moteur la produise.
 */

interface Scenario { scenarioId: string; versionId: string; title: string }

function scenario(index: number): Scenario {
  return { scenarioId: `s-${index}`, versionId: `v-${index}`, title: `Récit ${index}` };
}

/** Backend en mémoire respectant la convention `page`/`pageSize`/`query`. */
function stubCatalog(count: number) {
  const all = Array.from({ length: count }, (_, index) => scenario(index));
  const calls: string[] = [];
  const fetchStub = vi.fn(async (input: URL | string) => {
    const url = new URL(String(input));
    calls.push(url.search);
    const query = url.searchParams.get("query")?.toLowerCase() ?? "";
    const page = Number(url.searchParams.get("page"));
    const pageSize = Number(url.searchParams.get("pageSize"));
    const matching = query ? all.filter((item) => item.title.toLowerCase().includes(query)) : all;
    const items = matching.slice((page - 1) * pageSize, page * pageSize);
    return {
      ok: true,
      json: async () => ({ items, page, pageSize, total: matching.length }),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchStub);
  return { calls };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("HttpGenEngineClient — catalogue paginé", () => {
  it("demande page et pageSize, jamais offset ni limit", async () => {
    const { calls } = stubCatalog(213);
    const client = new HttpGenEngineClient("http://localhost:5201");
    const page = await client.listPublishedStories({ page: 2, pageSize: 20 });

    expect(calls[0]).toContain("page=2");
    expect(calls[0]).toContain("pageSize=20");
    expect(calls[0]).not.toContain("offset");
    expect(calls[0]).not.toContain("limit");
    expect(page.total).toBe(213);
    expect(page.items).toHaveLength(20);
    expect(page.items[0]?.id).toBe("v-20");
  });

  it("borne pageSize à 100 comme le backend", async () => {
    const { calls } = stubCatalog(300);
    const client = new HttpGenEngineClient("http://localhost:5201");
    await client.listPublishedStories({ pageSize: 5_000 });
    expect(calls[0]).toContain("pageSize=100");
  });

  it("transmet la recherche au serveur plutôt que de filtrer la page", async () => {
    const { calls } = stubCatalog(213);
    const client = new HttpGenEngineClient("http://localhost:5201");
    const page = await client.listPublishedStories({ query: "Récit 15", pageSize: 20 });

    expect(calls[0]).toContain("query=R%C3%A9cit+15");
    // 15, 150 à 159 : des correspondances qui vivent bien au-delà de la première page.
    expect(page.total).toBe(11);
    expect(page.items.map((story) => story.title)).toContain("Récit 157");
  });

  it("alterne les teintes sur le rang absolu, pas sur l'index de page", async () => {
    stubCatalog(213);
    const client = new HttpGenEngineClient("http://localhost:5201");
    const first = await client.listPublishedStories({ page: 1, pageSize: 20 });
    const second = await client.listPublishedStories({ page: 2, pageSize: 20 });
    // v-20 est de rang pair : même accent que v-0, quelle que soit sa page.
    expect(second.items[0]?.accent).toBe(first.items[0]?.accent);
    expect(second.items[1]?.accent).not.toBe(second.items[0]?.accent);
  });

  it("atteint le 213ᵉ récit en parcourant toutes les pages", async () => {
    stubCatalog(213);
    const client = new HttpGenEngineClient("http://localhost:5201");
    const whole = await client.listWholeCatalog();

    expect(whole.total).toBe(213);
    expect(whole.items).toHaveLength(213);
    expect(whole.items.at(-1)?.id).toBe("v-212");
  });

  it("résout plusieurs versions en un seul balayage et s'arrête dès qu'elles sont trouvées", async () => {
    const { calls } = stubCatalog(500);
    const client = new HttpGenEngineClient("http://localhost:5201");
    const found = await client.findStoriesByVersionIds(["v-5", "v-120"]);

    expect(found.map((story) => story.id)).toEqual(["v-5", "v-120"]);
    // Deux pages de 100 suffisent : le balayage ne va pas jusqu'au bout.
    expect(calls).toHaveLength(2);
  });

  it("ne renvoie rien pour une version absente, sans lever", async () => {
    stubCatalog(30);
    const client = new HttpGenEngineClient("http://localhost:5201");
    expect(await client.findStoriesByVersionIds(["inconnu"])).toEqual([]);
    expect(await client.findStoriesByVersionIds([])).toEqual([]);
  });

  it("échoue explicitement si le backend renvoie encore un tableau nu", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, json: async () => [scenario(0)],
    } as unknown as Response)));
    const client = new HttpGenEngineClient("http://localhost:5201");
    await expect(client.listPublishedStories()).rejects.toThrow(/bare array/);
  });
});
