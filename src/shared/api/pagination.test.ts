import { describe, expect, it } from "vitest";
import {
  clampPage, clampPageSize, defaultPageSize, hasMore, maximumPageSize, pageCount,
  readPageContract, readPositiveInteger,
} from "@/shared/api/pagination";

describe("bornes de pagination", () => {
  it("reproduit le clamp du backend sur pageSize", () => {
    expect(clampPageSize(undefined)).toBe(defaultPageSize);
    expect(clampPageSize(0)).toBe(1);
    expect(clampPageSize(-40)).toBe(1);
    expect(clampPageSize(1_000)).toBe(maximumPageSize);
    expect(clampPageSize(24)).toBe(24);
    expect(clampPageSize(Number.NaN)).toBe(defaultPageSize);
  });

  it("garde une page en base 1", () => {
    expect(clampPage(undefined)).toBe(1);
    expect(clampPage(0)).toBe(1);
    expect(clampPage(-3)).toBe(1);
    expect(clampPage(7)).toBe(7);
  });

  it("lit un entier de chaîne de requête sans produire NaN", () => {
    expect(readPositiveInteger(null)).toBeUndefined();
    expect(readPositiveInteger("")).toBeUndefined();
    expect(readPositiveInteger("abc")).toBeUndefined();
    expect(readPositiveInteger("12")).toBe(12);
  });

  it("compte les pages et le reste à charger", () => {
    expect(pageCount(213, 20)).toBe(11);
    expect(pageCount(0, 20)).toBe(1);
    expect(hasMore(20, 213)).toBe(true);
    expect(hasMore(213, 213)).toBe(false);
  });
});

describe("décodage de l'enveloppe", () => {
  it("accepte l'enveloppe documentée", () => {
    const page = readPageContract<number>({ items: [1, 2], page: 1, pageSize: 20, total: 213 }, "GET /catalog");
    expect(page).toEqual({ items: [1, 2], page: 1, pageSize: 20, total: 213 });
  });

  // Invariant 14 : un backend resté sur l'ancien contrat doit échouer bruyamment
  // plutôt que produire un catalogue silencieusement vide.
  it("refuse un tableau nu, forme d'avant la rupture de contrat", () => {
    expect(() => readPageContract([{ title: "x" }], "GET /catalog")).toThrow(/bare array/);
  });

  it("refuse une enveloppe incomplète", () => {
    expect(() => readPageContract({ items: [], page: 1, pageSize: 20 }, "GET /catalog")).toThrow(/unexpected/);
    expect(() => readPageContract(null, "GET /catalog")).toThrow(/non-object/);
  });
});
