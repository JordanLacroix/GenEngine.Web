import { describe, expect, it } from "vitest";
import type { BrandingContract } from "@/shared/api/contracts";
import {
  accentValue, accentVariableName, brandInitial, brandingStyleSheet, brandingVariables,
} from "@/shared/ui/branding-theme";

/**
 * Bloc `branding` **réellement servi** par
 * `GET /client-bootstrap/default` sur la pile locale « Le Diapason ».
 */
const diapasonBranding: BrandingContract = {
  applicationName: "Le Diapason",
  shortName: "Diapason",
  tagline: "Une réponse fluide n'est pas une réponse vérifiée.",
  theme: {
    colors: {
      ink: "#17344a", muted: "#c8b98d", accent: "#d7a746", danger: "#a33b2a",
      success: "#7a9a55", surface: "#fffaf0", warning: "#c98a2e", accentAlt: "#2f7fa0",
    },
    colorScheme: "Light",
    cornerRadius: 12,
    fontFamily: "Georgia, \"Times New Roman\", serif",
  },
  accentPalette: {
    or: "#d7a746", aube: "#e8b98c", azur: "#2f7fa0", amber: "#c98a2e",
    encre: "#17344a", sauge: "#7a9a55", cuivre: "#b0733a",
  },
};

describe("brandInitial", () => {
  it("dérive l'initiale du nom au lieu d'un monogramme figé", () => {
    // Un « G » codé en dur à côté de « Le Diapason » annonçait le moteur là où
    // l'utilisateur lit le nom de son instance.
    expect(brandInitial("Le Diapason")).toBe("D");
    expect(brandInitial("GenEngine")).toBe("G");
  });

  it("écarte l'article initial", () => {
    expect(brandInitial("La Boussole")).toBe("B");
    expect(brandInitial("Les Sentiers")).toBe("S");
    expect(brandInitial("The Compass")).toBe("C");
  });

  it("retombe sur le moteur quand aucun nom n'est publié", () => {
    expect(brandInitial(undefined)).toBe("G");
    expect(brandInitial("")).toBe("G");
    expect(brandInitial("   ")).toBe("G");
  });

  it("garde un seul caractère quel que soit le nom", () => {
    expect(brandInitial("École nationale supérieure")).toBe("É");
    expect(brandInitial("Le")).toBe("L");
  });
});

describe("accentVariableName", () => {
  it("translittère un jeton français en identifiant CSS sûr", () => {
    // Un jeton accentué ou espacé produirait une déclaration invalide, et une
    // déclaration invalide fait taire tout le bloc.
    expect(accentVariableName("or")).toBe("--accent-or");
    expect(accentVariableName("encre")).toBe("--accent-encre");
    expect(accentVariableName("Bleu Nuit")).toBe("--accent-bleu-nuit");
    expect(accentVariableName("écarlate")).toBe("--accent-ecarlate");
  });

  it("ne produit jamais un nom vide", () => {
    expect(accentVariableName("///")).toBe("--accent-unknown");
  });
});

describe("accentValue", () => {
  it("référence la variable du jeton avec un repli", () => {
    expect(accentValue("azur")).toBe("var(--accent-azur, var(--contour))");
    expect(accentValue("sauge", "var(--or)")).toBe("var(--accent-sauge, var(--or))");
  });

  it("retombe directement quand aucun jeton n'est déclaré", () => {
    expect(accentValue(undefined, "var(--or)")).toBe("var(--or)");
    expect(accentValue("", "var(--or)")).toBe("var(--or)");
  });
});

describe("brandingVariables", () => {
  it("projette les huit jetons de thème et la palette d'accents", () => {
    const variables = brandingVariables(diapasonBranding);
    expect(variables["--brand-ink"]).toBe("#17344a");
    expect(variables["--brand-surface"]).toBe("#fffaf0");
    expect(variables["--brand-accent"]).toBe("#d7a746");
    expect(variables["--brand-accent-alt"]).toBe("#2f7fa0");
    expect(variables["--brand-success"]).toBe("#7a9a55");
    expect(variables["--brand-warning"]).toBe("#c98a2e");
    expect(variables["--brand-danger"]).toBe("#a33b2a");
    expect(variables["--brand-muted"]).toBe("#c8b98d");
    expect(variables["--accent-or"]).toBe("#d7a746");
    expect(variables["--accent-encre"]).toBe("#17344a");
    expect(variables["--brand-radius"]).toBe("12px");
  });

  it("ne fabrique aucune variable en l'absence de bloc de marque", () => {
    // Le client n'invente pas une palette absente : les feuilles retombent
    // alors sur leurs littéraux et rendent exactement comme avant.
    expect(brandingVariables(undefined)).toEqual({});
    expect(brandingVariables(null)).toEqual({});
    expect(brandingVariables({ applicationName: "Sans thème" })).toEqual({});
  });

  it("écarte une couleur qui n'est pas un hexadécimal strict", () => {
    // Le moteur n'en publie pas d'autre forme : une valeur inattendue signale
    // une réponse qui n'est pas celle qu'on croit, et le repli littéral vaut
    // mieux qu'une couleur devinée.
    const variables = brandingVariables({
      theme: {
        colors: { ink: "rebeccapurple", accent: "#abc", surface: "#fffaf0" } as never,
        colorScheme: "Dark", cornerRadius: 8, fontFamily: "serif",
      },
    });
    expect(variables["--brand-ink"]).toBeUndefined();
    expect(variables["--brand-accent"]).toBeUndefined();
    expect(variables["--brand-surface"]).toBe("#fffaf0");
  });

  it("accepte l'alpha à huit chiffres", () => {
    const variables = brandingVariables({
      theme: {
        colors: { accent: "#d7a74680" } as never,
        colorScheme: "Dark", cornerRadius: 8, fontFamily: "serif",
      },
    });
    expect(variables["--brand-accent"]).toBe("#d7a74680");
  });

  it("refuse un rayon hors bornes et une police qui pourrait clore la règle", () => {
    const outOfRange = brandingVariables({
      theme: { colors: {} as never, colorScheme: "Dark", cornerRadius: 512, fontFamily: "Inter" },
    });
    expect(outOfRange["--brand-radius"]).toBeUndefined();

    const injected = brandingVariables({
      theme: { colors: {} as never, colorScheme: "Dark", cornerRadius: 8, fontFamily: "serif;}body{display:none" },
    });
    expect(injected["--brand-font-story"]).toBeUndefined();
  });
});

describe("brandingStyleSheet", () => {
  it("sérialise un bloc :root injectable au rendu serveur", () => {
    const sheet = brandingStyleSheet(diapasonBranding);
    expect(sheet.startsWith(":root{")).toBe(true);
    expect(sheet.endsWith("}")).toBe(true);
    expect(sheet).toContain("--brand-accent:#d7a746");
    expect(sheet).toContain("--accent-sauge:#7a9a55");
  });

  it("ne rend rien du tout quand il n'y a rien à déclarer", () => {
    // Une balise `<style>` vide serait du bruit dans le document ; l'appelant
    // teste la chaîne vide pour ne pas la rendre.
    expect(brandingStyleSheet(undefined)).toBe("");
    expect(brandingStyleSheet({ applicationName: "Sans thème" })).toBe("");
  });
});
