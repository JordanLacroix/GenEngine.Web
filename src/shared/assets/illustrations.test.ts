import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Les illustrations livrées sont désormais des SVG écrits à la main, et un SVG
 * mal formé ne casse rien de visible côté outillage : le lint ne le lit pas, le
 * build le recopie tel quel, et le navigateur se contente de ne rien peindre.
 * Un `--` égaré dans un commentaire XML a suffi à rendre la carte entièrement
 * noire une fois déjà. Ces contrôles-là valent donc d'être automatisés.
 */
const directory = join(process.cwd(), "public", "illustrations");
const svgFiles = readdirSync(directory).filter((name) => name.endsWith(".svg"));

/**
 * Contrôle de bonne formation, sans dépendance.
 *
 * L'environnement de test est `node` : il n'y a ni `DOMParser` ni analyseur XML
 * dans l'arbre, et en ajouter un pour quatre fichiers écrits à la main coûterait
 * plus que la garantie apportée. Ce contrôle vise donc les deux fautes qu'on
 * commet réellement en écrivant un SVG à la main — un `--` dans un commentaire,
 * une balise laissée ouverte — et pas la conformité XML complète.
 */
function xmlDefects(source: string): string[] {
  const defects: string[] = [];

  for (const [comment] of source.matchAll(/<!--[\s\S]*?-->/g)) {
    if (comment.slice(4, -3).includes("--")) defects.push(`commentaire contenant « -- » : ${comment.slice(0, 60)}…`);
  }
  if ((source.match(/<!--/g) ?? []).length !== (source.match(/-->/g) ?? []).length) {
    defects.push("commentaire non refermé");
  }

  const stack: string[] = [];
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, "");
  for (const match of withoutComments.matchAll(/<(\/?)([a-zA-Z][\w:.-]*)[^>]*?(\/?)>/g)) {
    const [tag, closing, name] = match;
    if (name === undefined) continue;
    if (closing === "/") {
      if (stack.pop() !== name) defects.push(`balise fermante inattendue : </${name}>`);
    } else if (!tag.trimEnd().endsWith("/>")) stack.push(name);
  }
  if (stack.length > 0) defects.push(`balises non refermées : ${stack.join(", ")}`);

  return defects;
}

describe("shipped illustrations", () => {
  it("ships at least the map and the familiar portrait", () => {
    expect(svgFiles).toContain("diapason-domains.svg");
    expect(svgFiles).toContain("familiar-tierce.svg");
  });

  it.each(svgFiles)("%s is well-formed XML", (name) => {
    expect(xmlDefects(readFileSync(join(directory, name), "utf8"))).toEqual([]);
  });

  // Un visuel distant a déjà été retiré deux fois de ce produit, dont une fois
  // sans être vu pendant des semaines. Aucune illustration ne référence un hôte.
  it.each(svgFiles)("%s embeds no remote reference", (name) => {
    const source = readFileSync(join(directory, name), "utf8");
    expect(source).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
  });

  // Chaque illustration porte un `role` et un `aria-label` : elle est décorative
  // dans la page, mais elle est aussi ouverte directement par son URL.
  it.each(svgFiles)("%s declares an accessible name", (name) => {
    const source = readFileSync(join(directory, name), "utf8");
    expect(source).toMatch(/role="img"/);
    expect(source).toMatch(/aria-label="[^"]{20,}"/);
  });
});
