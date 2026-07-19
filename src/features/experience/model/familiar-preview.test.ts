import { describe, expect, it } from "vitest";
import type { ExperienceDocumentContract } from "@/shared/api/contracts";
import {
  accentColor, familiarPreview, sampleLine, type FamiliarSelection,
} from "./familiar-preview";

type FamiliarDefinition = ExperienceDocumentContract["familiars"][number];

const definition: FamiliarDefinition = {
  id: "fam-1", name: "Lueur", description: "Un éclat curieux.", form: "spark",
  writingStyle: "Socratic", tone: "Warm", accent: "or", helpLevel: 2,
  capabilities: ["hint", "recap"], availableForms: ["spark", "owl", "fox"],
  availableTones: ["Warm", "Playful", "Direct", "Mysterious"],
  portraitUrl: "https://example.test/portrait.png",
};

function selection(overrides: Partial<FamiliarSelection> = {}): FamiliarSelection {
  return {
    familiarId: "fam-1", form: "spark", tone: "Warm", writingStyle: "Socratic", accent: "or",
    helpLevel: 2, interventionFrequency: 2, proactive: true, customName: "Lueur", ...overrides,
  };
}

describe("sampleLine", () => {
  it("change de registre quand le ton change", () => {
    const warm = sampleLine(selection({ tone: "Warm" }));
    const direct = sampleLine(selection({ tone: "Direct" }));
    expect(warm).not.toBe(direct);
    expect(warm).toContain("Vous avancez bien");
    expect(direct).not.toContain("Vous avancez bien");
  });

  it("change de construction quand le style d'explication change", () => {
    expect(sampleLine(selection({ writingStyle: "Socratic" }))).toContain("changer d’avis");
    expect(sampleLine(selection({ writingStyle: "Technical" }))).toContain("source primaire");
  });

  it("ajoute une précision seulement aux niveaux d'aide élevés", () => {
    expect(sampleLine(selection({ helpLevel: 2 }))).not.toContain("où regarder");
    expect(sampleLine(selection({ helpLevel: 4 }))).toContain("où regarder");
  });

  it("annonce le silence quand le niveau d'aide est nul", () => {
    expect(sampleLine(selection({ helpLevel: 0 }))).toContain("garde le silence");
  });

  it("emploie le nom choisi", () => {
    expect(sampleLine(selection({ customName: "Aster" }))).toMatch(/^Aster :/);
  });

  it("retombe sur un nom neutre quand le champ est vide", () => {
    expect(sampleLine(selection({ customName: "   " }))).toMatch(/^Votre familier :/);
  });
});

describe("accentColor", () => {
  it("traduit les accents connus", () => {
    expect(accentColor("azur")).toBe("#2f7fa0");
    expect(accentColor("sauge")).toBe("#7a9a55");
  });

  it("reste neutre pour un accent inconnu plutôt que d'inventer une teinte", () => {
    expect(accentColor("fuchsia-vif")).toBe("#c8b98d");
  });
});

describe("familiarPreview", () => {
  it("expose une classe de forme distincte par forme", () => {
    expect(familiarPreview(selection({ form: "owl" }), definition).formClass).toBe("familiar-form--owl");
    expect(familiarPreview(selection({ form: "fox" }), definition).formClass).toBe("familiar-form--fox");
  });

  it("résume le ton, le style et le niveau d'aide", () => {
    expect(familiarPreview(selection(), definition).cadence).toBe("Chaleureux · Socratique · aide 2/5");
  });

  it("laisse un pack importé primer sur la configuration", () => {
    const preview = familiarPreview(selection(), definition, { portraitUrl: "/local.png" });
    expect(preview.portraitUrl).toBe("/local.png");
  });

  it("traduit les capacités déclarées par la configuration", () => {
    expect(familiarPreview(selection(), definition).capabilities).toEqual(["Indice", "Récapitulatif"]);
  });
});
