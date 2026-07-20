"use client";

import { FileText, ScanLine } from "lucide-react";
import type {
  DocumentBlockContract, DocumentContract, DocumentLinesBlockContract,
  DocumentParagraphBlockContract, DocumentTableBlockContract,
} from "@/shared/api/contracts";
import {
  blockKey, documentLayout, excerptPercent, excerptSentence, markerPresentation, natureLabel,
} from "@/features/player/model/document-presentation";

/**
 * Rendu d'un document consultable (schéma de scénario v6).
 *
 * Le document est présenté **à côté** des choix de sortie, jamais à leur
 * place : consulter n'est jamais imposé. Ce composant ne porte donc aucune
 * action de sortie — l'appelant garde les `exitChoices` visibles pendant que
 * le document est ouvert.
 */
export function DocumentView({ document, busy, onConsult }: {
  document: DocumentContract;
  busy: boolean;
  onConsult(): void;
}) {
  const layout = documentLayout(document);
  return (
    <article className={`document-sheet document-sheet--${layout}`} aria-label={`Document : ${document.title}`}>
      <header className="document-head">
        <p className="eyebrow"><FileText size={13} aria-hidden="true" /> {natureLabel(document.nature)}</p>
        <h2>{document.title}</h2>
        {document.headers && document.headers.length > 0 && <dl className="document-headers">
          {document.headers.map((header) => <div key={header.name}>
            <dt>{header.name}</dt><dd>{header.value}</dd>
          </div>)}
        </dl>}
      </header>

      <div className="document-body">
        {document.blocks.map((block, index) => <DocumentBlock key={blockKey(block, index)} block={block} />)}
      </div>

      {/* L'aveu d'échantillonnage est un élément du document, pas une note de
          bas de page : il est rendu dans le cadre, sous le contenu qu'il
          qualifie, et il est lisible par un lecteur d'écran comme un statut. */}
      {document.excerpt && <p className="document-excerpt" role="status">
        <ScanLine size={14} aria-hidden="true" />
        <span>{excerptSentence(document.excerpt)}</span>
        <span className="document-excerpt-gauge" aria-hidden="true">
          <span style={{ width: `${excerptPercent(document.excerpt)}%` }} />
        </span>
      </p>}

      <button className="button button--primary document-consult" type="button" disabled={busy} onClick={onConsult}>
        Consulter ce document
      </button>
    </article>
  );
}

function DocumentBlock({ block }: { block: DocumentBlockContract }) {
  if (block.$type === "paragraph") return <DocumentParagraph block={block} />;
  if (block.$type === "lines") return <DocumentLines block={block} />;
  if (block.$type === "table") return <DocumentTable block={block} />;
  return null;
}

function DocumentParagraph({ block }: { block: DocumentParagraphBlockContract }) {
  return <p className="document-paragraph">{block.text}</p>;
}

/**
 * Lignes marquées : diff, journal applicatif, extrait de code.
 *
 * Rendu en liste ordonnée pour que la numérotation soit portée par le document
 * et non par un compteur décoratif, et parce qu'un lecteur d'écran annonce
 * alors le rang. La gouttière (`+`, `−`, `!`) est décorative — le marqueur est
 * aussi énoncé en texte, la couleur ne porte jamais seule l'information.
 */
function DocumentLines({ block }: { block: DocumentLinesBlockContract }) {
  return <ol className="document-lines">
    {block.lines.map((line, index) => {
      const marker = markerPresentation(line.marker);
      const slug = typeof line.marker === "string" ? line.marker.toLowerCase() : "plain";
      return <li key={`${index}-${line.text}`} className={`document-line document-line--${slug}`}>
        <span className="document-line-gutter" aria-hidden="true">{marker?.gutter ?? " "}</span>
        {marker && <span className="sr-only">{marker.label} : </span>}
        {line.label && <span className="document-line-label">{line.label}</span>}
        <code>{line.text}</code>
      </li>;
    })}
  </ol>;
}

/**
 * Table de données.
 *
 * Le moteur garantit que chaque rangée a l'arité des colonnes
 * (`document_row_arity_mismatch` au refus), donc aucune règle de remplissage
 * n'est inventée ici. La table défile dans son propre conteneur : le corps de
 * la page ne défile jamais horizontalement.
 */
function DocumentTable({ block }: { block: DocumentTableBlockContract }) {
  return <div className="document-table-scroll">
    <table className="document-table">
      <thead><tr>{block.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>
        {block.rows.map((row, index) => <tr key={`${index}-${row.cells.join("|")}`}>
          {row.cells.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{cell}</td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
