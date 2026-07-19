import type { ExperienceDocumentContract } from "@/shared/api/contracts";

type FamiliarDefinition = ExperienceDocumentContract["familiars"][number];

/** Réglage courant du familier, tel qu'il sera envoyé au service. */
export interface FamiliarSelection {
  familiarId: string;
  form: string;
  tone: string;
  writingStyle: string;
  accent: string;
  helpLevel: number;
  interventionFrequency: number;
  proactive: boolean;
  customName: string;
}

const formLabels: Record<string, string> = {
  spark: "Étincelle", owl: "Chouette", fox: "Renard", orb: "Orbe", lantern: "Lanterne", bot: "Automate",
};
const toneLabels: Record<string, string> = {
  Warm: "Chaleureux", Playful: "Joueur", Direct: "Direct", Mysterious: "Mystérieux",
  Reflective: "Réfléchi", Formal: "Formel",
};
const styleLabels: Record<string, string> = {
  Socratic: "Socratique", Concise: "Concis", Example: "Par l’exemple",
  Narrative: "Narratif", Technical: "Technique",
};
const capabilityLabels: Record<string, string> = {
  hint: "Indice", recap: "Récapitulatif", rephrase: "Reformulation",
  "known-path-warning": "Alerte chemin déjà pris", glossary: "Glossaire",
};
const accentColors: Record<string, string> = {
  amber: "#d7a746", or: "#d7a746", ember: "#d7a746", gold: "#d7a746",
  azur: "#2f7fa0", blue: "#2f7fa0", verdigris: "#2f7fa0",
  sauge: "#7a9a55", sage: "#7a9a55", green: "#7a9a55",
  ivoire: "#fffaf0", ivory: "#fffaf0",
};

export function formLabel(value: string) { return formLabels[value] ?? value; }
export function toneLabel(value: string) { return toneLabels[value] ?? value; }
export function styleLabel(value: string) { return styleLabels[value] ?? value; }
export function capabilityLabel(value: string) { return capabilityLabels[value] ?? value; }

/** Teinte d'accent réellement appliquée à l'aperçu. Une valeur inconnue reste neutre. */
export function accentColor(accent: string) { return accentColors[accent] ?? "#c8b98d"; }

/**
 * Ce que chaque paramètre change, dit en une phrase.
 *
 * Sans cette légende, un réglage se choisit à l'aveugle : la personne voit un
 * libellé mais pas sa conséquence. Chaque entrée décrit un effet observable dans
 * l'aperçu ou en partie.
 */
export function formEffect(value: string) {
  const effects: Record<string, string> = {
    spark: "Une présence minuscule et rapide : elle se manifeste en périphérie, sans occuper la scène.",
    owl: "Une présence posée : elle observe longtemps avant d’intervenir.",
    fox: "Une présence mobile : elle revient souvent, par petites touches.",
    orb: "Une présence abstraite : aucun visage, seulement une lueur.",
    lantern: "Une présence qui éclaire : elle montre plutôt qu’elle ne parle.",
    bot: "Une présence mécanique : ses interventions sont régulières et lisibles.",
  };
  return effects[value] ?? "Change la silhouette et la manière dont la présence occupe la scène.";
}

export function toneEffect(value: string) {
  const effects: Record<string, string> = {
    Warm: "Formulations encourageantes ; l’erreur est nommée sans être sanctionnée.",
    Playful: "Formulations légères, parfois taquines ; la tension retombe vite.",
    Direct: "Aucune circonvolution : le point est posé en une phrase.",
    Mysterious: "Des demi-mots et des images ; il en dit moins qu’il n’en sait.",
    Reflective: "Il ralentit et invite explicitement à reprendre du recul.",
    Formal: "Registre soutenu et distance constante.",
  };
  return effects[value] ?? "Change le registre des phrases, pas leur contenu.";
}

export function styleEffect(value: string) {
  const effects: Record<string, string> = {
    Socratic: "Il répond par une question qui déplace le problème.",
    Concise: "Une phrase, un point. Jamais de développement non demandé.",
    Example: "Il illustre par un cas analogue avant toute explication.",
    Narrative: "Il replace l’explication dans l’histoire en cours.",
    Technical: "Il nomme les mécanismes et emploie le vocabulaire exact.",
  };
  return effects[value] ?? "Change la construction de ses explications.";
}

export function helpLevelEffect(value: number) {
  if (value <= 1) return "Il n’intervient que si vous le sollicitez, et reste allusif.";
  if (value <= 3) return "Il oriente vers ce qu’il faut regarder, sans jamais trancher.";
  return "Il détaille la piste jusqu’au seuil de la décision — qui reste la vôtre.";
}

export function frequencyEffect(value: number) {
  if (value <= 1) return "Presque muet : quelques interventions par histoire.";
  if (value <= 3) return "Présent aux moments charnières du récit.";
  return "Commente la plupart des scènes.";
}

export function proactiveEffect(value: boolean) {
  return value
    ? "Il prend la parole de lui-même quand il repère une hésitation."
    : "Il attend systématiquement que vous l’appeliez.";
}

/**
 * Réplique d'exemple composée à partir des réglages.
 *
 * C'est l'aperçu le plus utile : il rend audible, avant validation, la
 * différence entre deux tons ou deux styles d'explication. La scène citée est
 * fictive et annoncée comme telle.
 */
export function sampleLine(selection: FamiliarSelection): string {
  const name = selection.customName.trim() || "Votre familier";
  if (selection.helpLevel <= 0) return `${name} garde le silence : le niveau d’aide est à zéro.`;

  const core = ((): string => {
    switch (selection.writingStyle) {
      case "Socratic":
        return "qu’est-ce qui vous ferait changer d’avis sur ce témoignage ?";
      case "Concise":
        return "ce témoignage n’est pas une mesure.";
      case "Example":
        return "hier, la même certitude venait d’une source unique.";
      case "Technical":
        return "vous tenez une source primaire non corroborée.";
      case "Narrative":
        return "quelqu’un, avant vous, a cru cette voix sur parole.";
      default:
        return "il reste une chose à vérifier avant de trancher.";
    }
  })();

  const opener = ((): string => {
    switch (selection.tone) {
      case "Warm": return "Vous avancez bien — ";
      case "Playful": return "Alors là, franchement — ";
      case "Direct": return "";
      case "Mysterious": return "Écoutez le silence entre deux phrases… ";
      case "Reflective": return "Prenons un instant. ";
      case "Formal": return "Permettez une remarque : ";
      default: return "";
    }
  })();

  const detail = selection.helpLevel >= 4
    ? " Je vous montre où regarder ; la conclusion reste la vôtre."
    : "";

  return `${name} : « ${opener}${core}${detail} »`;
}

/**
 * Projection complète de l'aperçu. La forme et l'accent deviennent des valeurs
 * CSS, ce qui rend l'aperçu instantané et sans coût.
 */
export interface FamiliarPreviewModel {
  name: string;
  accent: string;
  formClass: string;
  sample: string;
  cadence: string;
  capabilities: string[];
  portraitUrl?: string;
  backgroundUrl?: string;
}

export function familiarPreview(
  selection: FamiliarSelection,
  definition: FamiliarDefinition | undefined,
  overrides?: { portraitUrl?: string; backgroundUrl?: string },
): FamiliarPreviewModel {
  return {
    name: selection.customName.trim() || definition?.name || "Votre familier",
    accent: accentColor(selection.accent),
    formClass: `familiar-form--${selection.form || "spark"}`,
    sample: sampleLine(selection),
    cadence: `${toneLabel(selection.tone)} · ${styleLabel(selection.writingStyle)} · aide ${selection.helpLevel}/5`,
    capabilities: (definition?.capabilities ?? []).map(capabilityLabel),
    portraitUrl: overrides?.portraitUrl ?? definition?.portraitUrl ?? definition?.avatarUrl ?? undefined,
    backgroundUrl: overrides?.backgroundUrl ?? definition?.backgroundUrl ?? undefined,
  };
}
