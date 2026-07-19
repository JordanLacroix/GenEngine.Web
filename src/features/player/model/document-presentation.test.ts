import { describe, expect, it } from "vitest";
import type { DocumentContract } from "@/shared/api/contracts";
import {
  blockKey, documentLayout, excerptPercent, excerptSentence, excerptUnitLabel,
  isNeutralLine, markerPresentation, natureLabel,
} from "@/features/player/model/document-presentation";

/**
 * Ce document est la charge utile **réellement servie** par
 * `GET /sessions/{id}/current-step` sur « Le tri des candidatures », relevée
 * sur la pile locale. Une fixture inventée ne prouverait rien du contrat.
 */
const rankingDocument: DocumentContract = {
  title: "Classement automatique — 412 candidatures, 12 postes",
  nature: "Table",
  headers: [{ name: "Source", value: "Outil de présélection, exécution du lundi 08:03" }],
  excerpt: { shownUnits: 6, totalUnits: 412, unit: "Rows" },
  blocks: [
    {
      $type: "table",
      columns: ["Rang", "Dossier", "Score", "Explication produite par l'outil"],
      rows: [{ cells: ["1", "C-0148", "94", "Parcours conforme aux profils recrutés"] }],
    },
    { $type: "paragraph", text: "L'explication produite par l'outil est une phrase choisie dans une liste de neuf." },
  ],
};

describe("natureLabel", () => {
  it("nomme chaque nature de la taxonomie", () => {
    expect(natureLabel("Table")).toBe("Table de données");
    expect(natureLabel("Diff")).toBe("Correctif");
    expect(natureLabel("Log")).toBe("Journal applicatif");
  });

  it("reste neutre pour une nature imprévue plutôt que d'échouer", () => {
    // `Other` garde la taxonomie ouverte : une nature ajoutée côté moteur ne
    // doit pas casser le rendu d'un client déjà déployé.
    expect(natureLabel("Other")).toBe("Document");
    expect(natureLabel("Ordonnance")).toBe("Document");
  });
});

describe("documentLayout", () => {
  it("rend une table en table", () => {
    expect(documentLayout(rankingDocument)).toBe("table");
  });

  it("distingue le diff du journal", () => {
    expect(documentLayout({ ...rankingDocument, nature: "Diff" })).toBe("diff");
    expect(documentLayout({ ...rankingDocument, nature: "Log" })).toBe("log");
  });

  it("déduit la forme des blocs quand la nature ne la donne pas", () => {
    // La nature nomme ce que le document *est* ; les blocs disent comment il se
    // dessine. Une nature inconnue portant une table se rend donc en table.
    expect(documentLayout({ ...rankingDocument, nature: "Inconnue" })).toBe("table");
    expect(documentLayout({
      ...rankingDocument, nature: "Inconnue",
      blocks: [{ $type: "lines", lines: [{ text: "démarrage", marker: "Info" }] }],
    })).toBe("log");
    expect(documentLayout({
      ...rankingDocument, nature: "Inconnue",
      blocks: [{ $type: "paragraph", text: "Bonjour." }],
    })).toBe("prose");
  });
});

describe("excerptSentence", () => {
  it("annonce l'échantillon en toutes lettres", () => {
    // « 6 lignes sur 412 » : un échantillon présenté comme un tout serait un
    // mensonge d'interface, et le jeu porte sur la lucidité face à
    // l'information. C'est la garantie la plus importante de ce module.
    expect(excerptSentence({ shownUnits: 6, totalUnits: 412, unit: "Rows" }))
      .toBe("6 lignes affichées sur 412");
  });

  it("groupe les milliers dans la convention française", () => {
    const sentence = excerptSentence({ shownUnits: 4, totalUnits: 27_000, unit: "Paragraphs" });
    expect(sentence).toContain("27");
    expect(sentence).toMatch(/sur 27\s?000$/);
  });

  it("accorde le participe avec le genre de l'unité", () => {
    // Relevé à l'écran sur « La note de service » : le rendu disait
    // « 4 paragraphes affichées sur 27 ». Une faute d'accord dans la seule
    // phrase qui demande d'être crue affaiblit ce qu'elle affirme.
    expect(excerptSentence({ shownUnits: 4, totalUnits: 27, unit: "Paragraphs" }))
      .toBe("4 paragraphes affichés sur 27");
    // `toLocaleString("fr-FR")` sépare les milliers par une espace fine
    // insécable (U+202F), pas par une espace ordinaire.
    expect(excerptSentence({ shownUnits: 9, totalUnits: 1_348, unit: "Entries" }))
      .toBe("9 entrées affichées sur 1 348");
    expect(excerptSentence({ shownUnits: 3, totalUnits: 40, unit: "Messages" }))
      .toBe("3 messages affichés sur 40");
    expect(excerptSentence({ shownUnits: 2, totalUnits: 9, unit: "Octets" }))
      .toBe("2 éléments affichés sur 9");
  });

  it("accorde aussi le singulier", () => {
    expect(excerptSentence({ shownUnits: 1, totalUnits: 12, unit: "Lines" }))
      .toBe("1 ligne affichée sur 12");
    expect(excerptSentence({ shownUnits: 1, totalUnits: 12, unit: "Paragraphs" }))
      .toBe("1 paragraphe affiché sur 12");
  });

  it("nomme chaque unité déclarée par le moteur", () => {
    expect(excerptUnitLabel("Lines", 3)).toBe("lignes");
    expect(excerptUnitLabel("Messages", 1)).toBe("message");
    expect(excerptUnitLabel("Entries", 2)).toBe("entrées");
    expect(excerptUnitLabel("Paragraphs", 4)).toBe("paragraphes");
    expect(excerptUnitLabel("Octets", 4)).toBe("éléments");
  });
});

describe("excerptPercent", () => {
  it("reste visible même pour un échantillon minuscule", () => {
    // 6 sur 412 arrondirait à 1 % ; un 0 % afficherait une jauge vide, qui se
    // lit comme « rien n'est montré » alors que six lignes le sont.
    expect(excerptPercent({ shownUnits: 6, totalUnits: 412, unit: "Rows" })).toBe(1);
    expect(excerptPercent({ shownUnits: 1, totalUnits: 10_000, unit: "Rows" })).toBe(1);
  });

  it("ne divise pas par un total absent", () => {
    expect(excerptPercent({ shownUnits: 0, totalUnits: 0, unit: "Rows" })).toBe(0);
  });

  it("reflète une part réelle", () => {
    expect(excerptPercent({ shownUnits: 25, totalUnits: 100, unit: "Rows" })).toBe(25);
  });
});

describe("markerPresentation", () => {
  it("couvre le diff et le journal avec le même jeu de marqueurs", () => {
    expect(markerPresentation("Added")).toEqual({ label: "Ajouté", gutter: "+" });
    expect(markerPresentation("Removed")?.gutter).toBe("−");
    expect(markerPresentation("Error")?.label).toBe("Erreur");
  });

  it("montre un marqueur inconnu au lieu de l'effacer", () => {
    // Le scénario lui a donné un sens ; l'écarter perdrait de l'information.
    expect(markerPresentation("Deprecated")?.label).toBe("Deprecated");
  });

  it("ne présente rien lorsque la ligne n'est pas marquée", () => {
    expect(markerPresentation(undefined)).toBeUndefined();
    expect(markerPresentation(null)).toBeUndefined();
    expect(markerPresentation("")).toBeUndefined();
  });
});

describe("isNeutralLine", () => {
  it("traite le contexte et l'absence de marqueur comme neutres", () => {
    expect(isNeutralLine({ text: "inchangé" })).toBe(true);
    expect(isNeutralLine({ text: "inchangé", marker: "Context" })).toBe(true);
    expect(isNeutralLine({ text: "ajouté", marker: "Added" })).toBe(false);
  });
});

describe("blockKey", () => {
  it("identifie un bloc par son rang, seule identité qu'il possède", () => {
    expect(blockKey(rankingDocument.blocks[0]!, 0)).toBe("0-table");
    expect(blockKey(rankingDocument.blocks[1]!, 1)).toBe("1-paragraph");
  });
});
