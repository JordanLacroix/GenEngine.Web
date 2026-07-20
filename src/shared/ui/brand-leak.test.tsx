import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StorySummary } from "@/entities/story/model/story";
import { StoryCard } from "@/shared/ui/story-card";

/**
 * Garde anti-fuite de marque.
 *
 * « GenEngine » est le nom du **moteur**. Il est légitime là où l'on parle du
 * moteur — une attribution, un message d'erreur technique, la page de
 * présentation de la plateforme. Il ne l'est pas là où l'utilisateur devrait
 * lire le nom de **sa** configuration : la marque publiée par
 * `GET /client-bootstrap/{frontId}` est faite pour ça.
 *
 * Les défauts trouvés sur ce produit l'ont tous été à l'écran. Ce test ne
 * remplace pas le regard, il empêche la rechute : toute nouvelle occurrence
 * dans du texte destiné à l'utilisateur fait échouer, et il faut alors soit la
 * paramétrer, soit l'inscrire ici avec sa justification.
 */

const sourceRoot = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Occurrences délibérées, chacune avec le motif qui la garde.
 *
 * La valeur est le nombre attendu : ajouter une occurrence dans un fichier déjà
 * listé échoue aussi, sans quoi la liste deviendrait un blanc-seing par fichier.
 */
const deliberate: Readonly<Record<string, { count: number; why: string }>> = {
  "app/layout.tsx": {
    count: 1,
    why: "Pied de page « Propulsé par GenEngine » : attribution du moteur, posée à côté du nom de l’instance qui la précède.",
  },
  "features/home/ui/home-experience.tsx": {
    count: 2,
    why: "/plateforme présente le moteur lui-même et oppose explicitement l’instance (« Le Diapason ») au moteur qui l’exécute.",
  },
  "features/experience/model/familiar-assets.ts": {
    count: 2,
    why: "Licence et attribution d’une illustration réellement produite pour le projet GenEngine : une provenance ne se renomme pas.",
  },
  "shared/ui/branding-theme.ts": {
    count: 1,
    why: "`fallbackApplicationName` — le repli lui-même, employé quand aucune marque n’est publiée. Il nomme alors le moteur, ce qui est exact.",
  },
  "shared/api/genengine-server.ts": {
    count: 1,
    why: "Message d’erreur technique (`GenEngine API returned …`), destiné à l’exploitant et jamais rendu comme marque.",
  },
  "shared/api/genengine-client.ts": {
    count: 1,
    why: "Même message d’erreur technique côté client d’intégration.",
  },
};

/** Un fichier de code produit-facing : ni test, ni fixture de démonstration. */
function sourceFiles(directory: string, found: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "mocks") continue;
      sourceFiles(full, found);
      continue;
    }
    if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) continue;
    found.push(full);
  }
  return found;
}

/**
 * Retire les commentaires, puis les identifiants et variables d'environnement.
 *
 * `HttpGenEngineClient`, `genEngineRequest` ou `GENENGINE_AUTHORING_URL` ne sont
 * pas de la marque affichée : ce sont des noms de code, que `AGENTS.md` exige
 * justement de garder en anglais.
 */
function userFacingText(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join("\n")
    .replace(/GENENGINE_[A-Z_]+/g, "")
    .replace(/[A-Za-z0-9_$]*GenEngine[A-Za-z0-9_$]+/g, "")
    .replace(/[A-Za-z0-9_$]+GenEngine/g, "");
}

describe("fuites de marque", () => {
  it("ne laisse aucun littéral « GenEngine » hors des occurrences justifiées", () => {
    const actual: Record<string, number> = {};
    for (const file of sourceFiles(sourceRoot)) {
      const occurrences = userFacingText(readFileSync(file, "utf8")).split("GenEngine").length - 1;
      if (occurrences > 0) actual[relative(sourceRoot, file).replaceAll("\\", "/")] = occurrences;
    }

    const expected = Object.fromEntries(
      Object.entries(deliberate).map(([path, entry]) => [path, entry.count]),
    );
    expect(actual).toEqual(expected);
  });

  it("ne signe pas un scénario du catalogue avec le nom du moteur", () => {
    // Le catalogue Authoring ne publie aucun auteur. La carte n'en invente pas :
    // avant, chaque scénario était signé « par Communauté GenEngine ».
    const story: StorySummary = {
      id: "version-1", slug: "le-fait-qui-manque", title: "Le fait qui manque",
      eyebrow: "Version 1", synopsis: "Deux sentiers.",
      durationMinutes: 12, mood: "mystery", accent: "ember", scenarioVersionId: "version-1",
    };
    const markup = renderToStaticMarkup(<StoryCard story={story} />);
    expect(markup).not.toContain("GenEngine");
    expect(markup).not.toContain("par ");
  });

  it("affiche une signature quand une source en publie une", () => {
    // La démonstration hors ligne est un contenu de référence assumé : elle se
    // signe, et le repli « pas d'auteur » ne doit pas l'effacer.
    const markup = renderToStaticMarkup(<StoryCard story={{
      id: "demo", slug: "demo", title: "Démonstration", eyebrow: "Démo", synopsis: "…",
      author: "Configuration de référence Le Diapason",
      durationMinutes: 8, mood: "wonder", accent: "verdigris",
    }} />);
    expect(markup).toContain("Configuration de référence Le Diapason");
  });
});
