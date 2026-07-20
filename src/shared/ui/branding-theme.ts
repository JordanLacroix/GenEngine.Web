import type { BrandingContract } from "@/shared/api/contracts";

/**
 * Projection du bloc `branding` publié en variables CSS.
 *
 * Le moteur sert `branding.theme.colors` (huit jetons obligatoires) et
 * `branding.accentPalette` (jetons nommés — `or`, `azur`, `encre`, `sauge`…
 * → vraies couleurs). Sans cette projection, `categories[].accent`,
 * `journeys[].accent` et `familiars[].accent` ne sont **pas rendables** :
 * ce sont des noms, pas des couleurs.
 *
 * Toutes les variables produites sont préfixées et *facultatives* : les
 * feuilles de style les consomment avec un repli littéral
 * (`var(--brand-accent, #d7a746)`), donc une instance sans `branding` rend
 * exactement comme avant. Le client ne fabrique jamais de palette absente.
 */

/** Nom de marque affichable. Une configuration illisible retombe sur « GenEngine ». */
export const fallbackApplicationName = "GenEngine";

/**
 * Initiale de la pastille de marque.
 *
 * Elle **dérive du nom** au lieu d'être codée en dur : un « G » figé à côté de
 * « Le Diapason » annonce le moteur là où l'utilisateur lit le nom de son
 * instance. L'article initial est écarté — « Le Diapason » donne « D », pas
 * « L ».
 */
export function brandInitial(name: string | null | undefined): string {
  const words = (name ?? fallbackApplicationName).trim().split(/\s+/).filter(Boolean);
  const articles = new Set(["le", "la", "les", "l'", "un", "une", "the", "el"]);
  const first = words.find((word) => !articles.has(word.toLowerCase().replace(/[’']$/, "'"))) ?? words[0];
  return (first ?? fallbackApplicationName)[0]?.toLocaleUpperCase("fr-FR") ?? "G";
}

/**
 * Nom CSS d'un jeton d'accent.
 *
 * Les jetons sont des mots français libres (`encre`, `sauge`, `cuivre`…) : ils
 * sont translittérés en identifiant CSS sûr, sinon un jeton accentué ou
 * espacé produirait une déclaration invalide qui ferait taire tout le bloc.
 */
export function accentVariableName(token: string): string {
  const slug = token
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `--accent-${slug || "unknown"}`;
}

/** Référence CSS d'un jeton d'accent, avec repli neutre si le jeton est inconnu. */
export function accentValue(token: string | null | undefined, fallback = "var(--contour)"): string {
  if (!token) return fallback;
  return `var(${accentVariableName(token)}, ${fallback})`;
}

/** Un hexadécimal strict `#RRGGBB` ou `#RRGGBBAA`, la seule forme que le moteur publie. */
function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

/**
 * Variables CSS à poser sur `:root`.
 *
 * Une valeur qui n'est pas un hexadécimal strict est **écartée** plutôt que
 * réécrite : le moteur n'en publie pas d'autre, donc une valeur inattendue
 * signale une réponse qui n'est pas celle qu'on croit, et le repli littéral
 * des feuilles est un meilleur résultat qu'une couleur devinée.
 */
export function brandingVariables(branding: BrandingContract | null | undefined): Record<string, string> {
  const variables: Record<string, string> = {};
  if (!branding) return variables;

  for (const [token, color] of Object.entries(branding.theme?.colors ?? {})) {
    if (isHexColor(color)) variables[`--brand-${kebab(token)}`] = color;
  }
  for (const [token, color] of Object.entries(branding.accentPalette ?? {})) {
    if (isHexColor(color)) variables[accentVariableName(token)] = color;
  }

  const radius = branding.theme?.cornerRadius;
  if (typeof radius === "number" && Number.isFinite(radius) && radius >= 0 && radius <= 64) {
    variables["--brand-radius"] = `${radius}px`;
  }
  // La famille typographique est reprise telle quelle, mais confinée : elle ne
  // remplace pas la police d'interface, seulement celle des textes narratifs,
  // là où la direction visuelle de l'instance a un sens.
  const fontFamily = branding.theme?.fontFamily?.trim();
  if (fontFamily && fontFamily.length <= 120 && !/[;{}]/.test(fontFamily)) {
    variables["--brand-font-story"] = fontFamily;
  }
  return variables;
}

/** Bloc `:root { … }` sérialisé, à injecter dans le document rendu côté serveur. */
export function brandingStyleSheet(branding: BrandingContract | null | undefined): string {
  const entries = Object.entries(brandingVariables(branding));
  if (entries.length === 0) return "";
  return `:root{${entries.map(([name, value]) => `${name}:${value}`).join(";")}}`;
}

function kebab(token: string): string {
  return token.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
