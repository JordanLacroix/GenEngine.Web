"use client";

import { Check, MessageSquareQuote, Sparkles } from "lucide-react";
import type { ExperienceDocumentContract } from "@/shared/api/contracts";
import {
  accentColor, capabilityLabel, familiarPreview, formEffect, formLabel, frequencyEffect,
  helpLevelEffect, proactiveEffect, styleEffect, styleLabel, toneEffect, toneLabel,
  type FamiliarSelection,
} from "@/features/experience/model/familiar-preview";

type FamiliarDefinition = ExperienceDocumentContract["familiars"][number];

/** Styles d'explication proposés quand la configuration n'en publie pas la liste. */
const fallbackWritingStyles = ["Socratic", "Concise", "Example", "Narrative", "Technical"];
const fallbackAccents = ["or", "azur", "sauge", "ivoire"];

export interface FamiliarConfiguratorProps {
  definitions: FamiliarDefinition[];
  definition: FamiliarDefinition;
  selection: FamiliarSelection;
  /** Illustrations importées localement, prioritaires sur celles de la configuration. */
  overrides?: { portraitUrl?: string; backgroundUrl?: string };
  onChange(patch: Partial<FamiliarSelection>): void;
  onSelectFamiliar(id: string): void;
}

/**
 * Aperçu du familier.
 *
 * Il est rendu par le même composant que la partie et lit exactement l'état en
 * cours de réglage : aucun brouillon intermédiaire, donc aucun écart possible
 * entre ce qui est montré et ce qui sera enregistré. Forme et accent deviennent
 * des valeurs CSS, la réplique d'exemple rend audibles le ton et le style.
 */
export function FamiliarPreviewPane({ selection, definition, overrides }: {
  selection: FamiliarSelection; definition: FamiliarDefinition; overrides?: { portraitUrl?: string; backgroundUrl?: string };
}) {
  const preview = familiarPreview(selection, definition, overrides);
  return <div
    className={`familiar-preview ${preview.formClass}`}
    style={{
      ...(preview.backgroundUrl
        ? { backgroundImage: `linear-gradient(rgb(6 15 23 / 22%), rgb(6 15 23 / 88%)), url(${preview.backgroundUrl})` }
        : {}),
      ["--familiar-accent" as string]: preview.accent,
    }}
  >
    <span className="familiar-aura" aria-hidden="true" />
    {preview.portraitUrl
      ? <img src={preview.portraitUrl} alt={`Aperçu de ${preview.name}`} />
      : <span className="familiar-glyph" aria-hidden="true">✦</span>}
    <strong>{preview.name}</strong>
    <small>{preview.cadence}</small>
    <p className="familiar-sample">
      <MessageSquareQuote size={14} aria-hidden="true" />
      <span>{preview.sample}</span>
    </p>
    <small className="familiar-sample-note">Réplique d’exemple sur une scène fictive, recomposée à chaque réglage.</small>
    {preview.capabilities.length > 0 && <ul className="familiar-capabilities">
      {preview.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
    </ul>}
  </div>;
}

/** Un groupe de choix, doublé de la conséquence du choix courant. */
function ChoiceGroup({ legend, values, current, label, effect, onPick }: {
  legend: string; values: string[]; current: string;
  label(value: string): string; effect(value: string): string; onPick(value: string): void;
}) {
  if (values.length === 0) return null;
  return <fieldset>
    <legend>{legend}</legend>
    <div className="segmented">
      {values.map((value) => <button
        type="button" key={value}
        className={current === value ? "is-selected" : ""}
        aria-pressed={current === value}
        onClick={() => onPick(value)}
      >{current === value && <Check aria-hidden="true" />}{label(value)}</button>)}
    </div>
    <p className="field-effect">{effect(current)}</p>
  </fieldset>;
}

function Slider({ legend, value, effect, onChange }: {
  legend: string; value: number; effect(value: number): string; onChange(value: number): void;
}) {
  return <label className="help-slider">
    <span>{legend}<b>{value}/5</b></span>
    <input type="range" min="0" max="5" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    <small>Discret</small>
    <small>Très présent</small>
    <p className="field-effect">{effect(value)}</p>
  </label>;
}

/**
 * Réglages du familier.
 *
 * Le modèle du moteur porte davantage que la forme et le ton : style
 * d'explication, accent, capacités, niveau et fréquence d'aide, initiative.
 * Chaque réglage est exposé et accompagné de son effet, pour qu'il se choisisse
 * en connaissance de cause plutôt qu'au libellé.
 */
export function FamiliarConfigurator({
  definitions, definition, selection, onChange, onSelectFamiliar,
}: FamiliarConfiguratorProps) {
  const writingStyles = definition.writingStyle && !fallbackWritingStyles.includes(definition.writingStyle)
    ? [definition.writingStyle, ...fallbackWritingStyles]
    : fallbackWritingStyles;
  const accents = definition.accent && !fallbackAccents.includes(definition.accent)
    ? [definition.accent, ...fallbackAccents]
    : fallbackAccents;

  return <>
    {definitions.length > 1 && <ChoiceGroup
      legend="Présence"
      values={definitions.map((item) => item.id)}
      current={selection.familiarId}
      label={(id) => definitions.find((item) => item.id === id)?.name ?? id}
      effect={(id) => definitions.find((item) => item.id === id)?.description ?? ""}
      onPick={onSelectFamiliar}
    />}

    <label className="familiar-name">Son nom
      <input value={selection.customName} maxLength={80} onChange={(event) => onChange({ customName: event.target.value })} />
      <p className="field-effect">Le nom apparaît dans la HUD, le journal et chacune de ses répliques.</p>
    </label>

    <ChoiceGroup
      legend="Forme" values={definition.availableForms} current={selection.form}
      label={formLabel} effect={formEffect} onPick={(form) => onChange({ form })}
    />
    <ChoiceGroup
      legend="Personnalité" values={definition.availableTones} current={selection.tone}
      label={toneLabel} effect={toneEffect} onPick={(tone) => onChange({ tone })}
    />
    <ChoiceGroup
      legend="Style d’explication" values={writingStyles} current={selection.writingStyle}
      label={styleLabel} effect={styleEffect} onPick={(writingStyle) => onChange({ writingStyle })}
    />

    <fieldset>
      <legend>Accent</legend>
      <div className="accent-row">
        {accents.map((accent) => <button
          type="button" key={accent}
          className={selection.accent === accent ? "accent-chip is-selected" : "accent-chip"}
          style={{ ["--chip" as string]: accentColor(accent) }}
          aria-pressed={selection.accent === accent}
          onClick={() => onChange({ accent })}
        ><span aria-hidden="true" />{accent}</button>)}
      </div>
      <p className="field-effect">L’accent teinte l’aura de l’aperçu et les signaux du familier dans la scène.</p>
    </fieldset>

    <Slider legend="Niveau d’aide" value={selection.helpLevel} effect={helpLevelEffect} onChange={(helpLevel) => onChange({ helpLevel })} />
    <Slider legend="Fréquence d’intervention" value={selection.interventionFrequency} effect={frequencyEffect} onChange={(interventionFrequency) => onChange({ interventionFrequency })} />

    <label className="toggle-line">
      <input type="checkbox" checked={selection.proactive} onChange={(event) => onChange({ proactive: event.target.checked })} />
      Me proposer de l’aide au bon moment
    </label>
    <p className="field-effect">{proactiveEffect(selection.proactive)}</p>

    {definition.capabilities.length > 0 && <div className="familiar-capability-note">
      <Sparkles size={14} aria-hidden="true" />
      <span>
        Capacités fournies par la configuration : {definition.capabilities.map(capabilityLabel).join(", ")}.
        Elles sont définies par l’organisation et ne se règlent pas ici.
      </span>
    </div>}
  </>;
}
