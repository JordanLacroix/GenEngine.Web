import { describe, expect, it } from "vitest";
import {
  maximumTrackedSessions, readStartedVersionIds, sessionStorageKey, sessionStorageKeyPrefix,
} from "@/shared/lib/local-sessions";

function storageOf(keys: string[]): Pick<Storage, "length" | "key"> {
  return { length: keys.length, key: (index: number) => keys[index] ?? null };
}

describe("sessions commencées sur l'appareil", () => {
  it("compose et relit la même clé", () => {
    expect(sessionStorageKey("v-1")).toBe(`${sessionStorageKeyPrefix}v-1`);
    expect(readStartedVersionIds(storageOf([sessionStorageKey("v-1")]))).toEqual(["v-1"]);
  });

  it("ignore les clés étrangères et le préfixe nu", () => {
    const keys = [sessionStorageKey("v-1"), "autre.chose", sessionStorageKeyPrefix, sessionStorageKey("v-2")];
    expect(readStartedVersionIds(storageOf(keys))).toEqual(["v-1", "v-2"]);
  });

  it("borne le nombre de reprises résolues", () => {
    const keys = Array.from({ length: 400 }, (_, index) => sessionStorageKey(`v-${index}`));
    expect(readStartedVersionIds(storageOf(keys))).toHaveLength(maximumTrackedSessions);
  });

  it("reste neutre sans stockage, côté serveur", () => {
    expect(readStartedVersionIds(undefined)).toEqual([]);
  });
});
