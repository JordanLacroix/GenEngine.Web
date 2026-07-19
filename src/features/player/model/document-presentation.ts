import type {
  DocumentBlockContract, DocumentContract, DocumentExcerptContract, DocumentLineContract,
} from "@/shared/api/contracts";

/**
 * Présentation d'un document consultable (schéma de scénario v6).
 *
 * Le moteur envoie une structure — nature, en-têtes, blocs, aveu
 * d'échantillonnage — et le client la rend telle quelle : une table en table,
 * un diff en diff, un journal en journal. Rien n'est reformulé, rien n'est
 * complété, et surtout rien n'est arrondi : l'échantillon s'annonce.
 */

/** Libellé humain d'une nature. Une nature imprévue reste nommée « Document ». */
export function natureLabel(nature: string): string {
  return ({
    Memo: "Note de service",
    Email: "Courriel",
    Code: "Extrait de code",
    Diff: "Correctif",
    Log: "Journal applicatif",
    Table: "Table de données",
    Conversation: "Conversation",
    Report: "Rapport",
    Other: "Document",
  } as Record<string, string>)[nature] ?? "Document";
}

/**
 * Famille de rendu.
 *
 * Elle dérive de la nature *et* des blocs reçus, parce que la nature nomme ce
 * que le document **est** tandis que les blocs disent comment il se dessine :
 * un `Report` fait de lignes marquées se lit comme un journal.
 */
export type DocumentLayout = "prose" | "table" | "diff" | "log" | "code" | "conversation";

export function documentLayout(document: DocumentContract): DocumentLayout {
  switch (document.nature) {
    case "Table": return "table";
    case "Diff": return "diff";
    case "Log": return "log";
    case "Code": return "code";
    case "Conversation": return "conversation";
    case "Memo": case "Email": case "Report": return "prose";
    default:
      return document.blocks.some((block) => block.$type === "table") ? "table"
        : document.blocks.some((block) => block.$type === "lines") ? "log"
          : "prose";
  }
}

/** Libellé d'un marqueur de ligne, et son symbole de gouttière. */
export function markerPresentation(marker: string | null | undefined): { label: string; gutter: string } | undefined {
  if (!marker) return undefined;
  return ({
    Added: { label: "Ajouté", gutter: "+" },
    Removed: { label: "Retiré", gutter: "−" },
    Context: { label: "Contexte", gutter: " " },
    Warning: { label: "Avertissement", gutter: "!" },
    Error: { label: "Erreur", gutter: "×" },
    Info: { label: "Information", gutter: "·" },
  } as Record<string, { label: string; gutter: string }>)[marker]
    // Un marqueur inconnu est **montré tel quel** plutôt qu'effacé : le
    // scénario lui a donné un sens que le client n'a pas à trancher.
    ?? { label: marker, gutter: "·" };
}

/**
 * Unités d'échantillon, avec leur genre.
 *
 * Le genre n'est pas décoratif : il accorde le participe de la phrase
 * d'échantillon. Sans lui, on lit « 4 paragraphes affichées sur 27 », et une
 * faute d'accord dans la seule phrase qui demande d'être crue affaiblit
 * exactement ce qu'elle affirme.
 */
const excerptUnits: Record<string, { singular: string; plural: string; feminine: boolean }> = {
  Lines: { singular: "ligne", plural: "lignes", feminine: true },
  Rows: { singular: "ligne", plural: "lignes", feminine: true },
  Messages: { singular: "message", plural: "messages", feminine: false },
  Entries: { singular: "entrée", plural: "entrées", feminine: true },
  Paragraphs: { singular: "paragraphe", plural: "paragraphes", feminine: false },
};

/** Une unité inconnue reste nommable plutôt que de faire échouer la phrase. */
const unknownUnit = { singular: "élément", plural: "éléments", feminine: false };

/** Unité d'échantillon au pluriel français, telle qu'elle se lit dans la phrase. */
export function excerptUnitLabel(unit: string, count: number): string {
  const entry = excerptUnits[unit] ?? unknownUnit;
  return count > 1 ? entry.plural : entry.singular;
}

/**
 * L'aveu d'échantillonnage, en toutes lettres.
 *
 * « 6 lignes sur 412 », jamais « 6 lignes ». Le moteur garantit
 * `shownUnits < totalUnits`, donc cette phrase retranche toujours quelque
 * chose ; présenter l'échantillon comme un tout serait un mensonge
 * d'interface, et c'est précisément ce sur quoi le jeu porte.
 */
export function excerptSentence(excerpt: DocumentExcerptContract): string {
  const shown = excerpt.shownUnits.toLocaleString("fr-FR");
  const total = excerpt.totalUnits.toLocaleString("fr-FR");
  const unit = excerptUnits[excerpt.unit] ?? unknownUnit;
  const participle = `affiché${unit.feminine ? "e" : ""}${excerpt.shownUnits > 1 ? "s" : ""}`;
  return `${shown} ${excerptUnitLabel(excerpt.unit, excerpt.shownUnits)} ${participle} sur ${total}`;
}

/** Part visible du document, entre 0 et 100, pour la jauge d'échantillon. */
export function excerptPercent(excerpt: DocumentExcerptContract): number {
  if (excerpt.totalUnits <= 0) return 0;
  return Math.max(1, Math.round((excerpt.shownUnits / excerpt.totalUnits) * 100));
}

/**
 * Clé de rendu stable d'un bloc. Les blocs n'ont pas d'identifiant : leur rang
 * dans la liste est leur seule identité, et il est stable puisque le document
 * appartient à un snapshot publié.
 */
export function blockKey(block: DocumentBlockContract, index: number): string {
  return `${index}-${block.$type}`;
}

/** Une ligne est-elle une continuation visuelle (`Context`) plutôt qu'un changement ? */
export function isNeutralLine(line: DocumentLineContract): boolean {
  return !line.marker || line.marker === "Context";
}
