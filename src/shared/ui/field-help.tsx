"use client";

import { HelpCircle } from "lucide-react";
import {
  Children, cloneElement, createContext, isValidElement, useContext, useEffect, useId, useMemo,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import type { FieldDescriptorContract } from "@/shared/api/contracts";

/**
 * Aide par champ, servie par le moteur et rendue à côté du contrôle.
 *
 * **Ce que le client ne fait pas** : il n'écrit aucun de ces textes. Le moteur
 * documente les 202 champs du document d'expérience et garde cette
 * documentation exhaustive par un test de complétude bidirectionnel. Un texte
 * recopié ici divergerait au premier changement de schéma, sans que rien
 * n'échoue.
 *
 * **Densité.** Un formulaire d'administration porte des dizaines de champs :
 * trois lignes chacun le rendraient illisible, et l'aide cesserait d'être lue.
 * L'arbitrage retenu suit celui que le produit applique déjà au configurateur
 * de familier (`.field-effect`) :
 *
 * - le **libellé** reste celui de l'écran, toujours visible ;
 * - la **description** — « de quoi il s'agit » — est toujours visible, sur une
 *   ligne discrète sous le contrôle. C'est la demande explicite : on ne doit
 *   jamais avoir à cliquer pour savoir ce qu'est un champ ;
 * - la **contrainte** et l'**exemple** — « ce que le moteur accepte » — sont
 *   dépliables. Ce sont des textes longs (« Doit définir ink, surface, accent,
 *   accentAlt, success, warning, danger et muted »), consultés au moment de
 *   saisir et non en lisant le formulaire.
 *
 * Le dépliage est un bouton, pas un survol : une infobulle au survol est
 * inatteignable au clavier et au tactile, et la contrainte est précisément ce
 * qu'on veut relire quand une saisie est refusée.
 *
 * **Repli.** Un chemin sans descripteur, un moteur plus ancien, un refus
 * d'autorisation : le champ garde son libellé et son contrôle, sans aide et
 * sans erreur. L'aide est un supplément, jamais une dépendance.
 */

interface FieldHelpState {
  readonly descriptors: ReadonlyMap<string, FieldDescriptorContract>;
  /** `true` tant que la première lecture est en cours. */
  readonly loading: boolean;
}

const emptyState: FieldHelpState = { descriptors: new Map(), loading: false };
const FieldHelpContext = createContext<FieldHelpState>(emptyState);

/**
 * Normalise un chemin de champ vers la forme publiée par le moteur.
 *
 * Un appelant qui dispose d'un index concret (`journeys[2].name`) désigne le
 * même champ que le descripteur `journeys[].name` : l'index est une donnée, pas
 * une partie du chemin.
 */
export function normalizeFieldPath(path: string): string {
  return path.replace(/\[\d+\]/g, "[]");
}

/**
 * Charge l'aide une fois pour toute la surface qu'il enveloppe.
 *
 * La lecture est faite au montage, pas au rendu d'un champ : 202 descripteurs
 * ne doivent pas repartir sur le réseau à chaque frappe. L'échec est silencieux
 * par construction — l'absence d'aide ne doit pas empêcher de configurer.
 */
export function FieldHelpProvider({ children }: { children: ReactNode }) {
  const [descriptors, setDescriptors] = useState<ReadonlyMap<string, FieldDescriptorContract>>(emptyState.descriptors);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/field-descriptors", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<FieldDescriptorContract[]> : undefined)
      .then((items) => {
        if (!items) return;
        setDescriptors(new Map(items.map((item) => [normalizeFieldPath(item.path), item])));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const value = useMemo<FieldHelpState>(() => ({ descriptors, loading }), [descriptors, loading]);
  return <FieldHelpContext.Provider value={value}>{children}</FieldHelpContext.Provider>;
}

/** Le descripteur d'un champ, ou `undefined` si le moteur n'en publie pas. */
export function useFieldDescriptor(path: string | undefined): FieldDescriptorContract | undefined {
  const { descriptors } = useContext(FieldHelpContext);
  return path ? descriptors.get(normalizeFieldPath(path)) : undefined;
}

/** Contrôles natifs qui portent `aria-describedby`. */
const controlTags = new Set(["input", "select", "textarea"]);

interface DescribableProps {
  "aria-describedby"?: string;
  children?: ReactNode;
}

/**
 * Rattache `aria-describedby` au contrôle réel, où qu'il soit dans l'arbre.
 *
 * Poser l'attribut sur un conteneur ne le rendrait pas : seul le contrôle
 * focusable est annoncé. Les appelants passent des formes variées — un `input`
 * seul, un `input` suivi d'un `small`, un `input` niché dans un `label.switch` —
 * donc la descente est récursive et laisse intact tout ce qui n'est pas un
 * contrôle. Une description existante est conservée, jamais remplacée.
 */
function describeControls(node: ReactNode, describedBy: string): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<DescribableProps>;
    if (typeof element.type === "string" && controlTags.has(element.type)) {
      const existing = element.props["aria-describedby"];
      return cloneElement(element, { "aria-describedby": existing ? `${existing} ${describedBy}` : describedBy });
    }
    if (element.props.children !== undefined) {
      return cloneElement(element, { children: describeControls(element.props.children, describedBy) });
    }
    return element;
  });
}

export interface ConfiguredFieldProps {
  /**
   * Chemin du champ dans le document d'expérience, tel que le moteur le publie
   * (`game.name`, `aiProviders[].deployment`). Absent, le champ rend son
   * libellé seul : c'est le repli, pas une erreur.
   */
  path?: string;
  /**
   * Libellé de l'écran. Il prime sur celui du descripteur : les intitulés
   * choisis pour cette interface sont plus proches de ce que l'opérateur y
   * fait que la dénomination du schéma.
   */
  label?: string;
  /** Occupe toute la largeur de la grille. */
  wide?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Un champ de configuration : libellé, contrôle, description, contrainte.
 *
 * L'enveloppe reste un `<label>`, donc cliquer l'intitulé focalise toujours le
 * contrôle. Le bouton d'aide neutralise cette activation, sans quoi le déplier
 * volerait le focus au champ.
 */
export function ConfiguredField({ path, label, wide, className, children }: ConfiguredFieldProps) {
  const descriptor = useFieldDescriptor(path);
  const reactId = useId();
  const [expanded, setExpanded] = useState(false);

  const shownLabel = label ?? descriptor?.label;
  const description = descriptor?.description?.trim();
  const constraint = descriptor?.constraint?.trim();
  const example = descriptor?.example?.trim();
  const hasDetail = Boolean(constraint ?? example);

  const descriptionId = `${reactId}-description`;
  const detailId = `${reactId}-detail`;
  const describedBy = [description ? descriptionId : undefined, expanded && hasDetail ? detailId : undefined]
    .filter(Boolean).join(" ");

  const classes = ["configured-field", wide ? "field-wide" : undefined, className].filter(Boolean).join(" ");

  return <label className={classes}>
    {shownLabel && <span className="configured-field-label">
      {shownLabel}
      {hasDetail && <button
        type="button"
        className="field-help-toggle"
        aria-expanded={expanded}
        aria-controls={detailId}
        aria-label={`Contraintes du champ ${shownLabel}`}
        onClick={(event) => { event.preventDefault(); setExpanded((value) => !value); }}
      ><HelpCircle aria-hidden="true" /></button>}
    </span>}
    {describedBy ? describeControls(children, describedBy) : children}
    {description && <span className="field-effect" id={descriptionId}>{description}</span>}
    {hasDetail && <span className="field-detail" id={detailId} hidden={!expanded}>
      {constraint && <b>{constraint}</b>}
      {example && <em>Exemple : {example}</em>}
    </span>}
  </label>;
}
