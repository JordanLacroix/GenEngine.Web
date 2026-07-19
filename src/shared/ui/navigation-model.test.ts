import { describe, expect, it } from "vitest";
import { buildNavigationLinks, hasOwnNavigation, isActiveLink } from "./navigation-model";

const anonymous = { permissions: new Set<string>(), authenticated: false };
const full = { permissions: new Set(["session.play", "scenario.author", "config.read"]), authenticated: true };

function hrefs(options: Parameters<typeof buildNavigationLinks>[0]) {
  return buildNavigationLinks(options).map((link) => link.href);
}

describe("hasOwnNavigation", () => {
  it("désigne les routes qui portent déjà leur navigation", () => {
    for (const path of ["/experience", "/play/demo", "/play/abc", "/studio", "/administration"]) {
      expect(hasOwnNavigation(path)).toBe(true);
    }
  });

  it("laisse l’en-tête global aux autres routes", () => {
    for (const path of ["/", "/plateforme", "/library", "/library/abc", "/parametres"]) {
      expect(hasOwnNavigation(path)).toBe(false);
    }
  });

  it("ne se déclenche pas sur un préfixe qui ressemble", () => {
    expect(hasOwnNavigation("/playground")).toBe(false);
    expect(hasOwnNavigation("/studios")).toBe(false);
  });
});

describe("buildNavigationLinks", () => {
  it("propose la démonstration et les paramètres à un visiteur anonyme", () => {
    expect(hrefs(anonymous)).toEqual(["/", "/play/demo", "/plateforme", "/library", "/parametres"]);
  });

  it("retire la démonstration dès qu’une session existe", () => {
    expect(hrefs(full)).not.toContain("/play/demo");
  });

  it("garde les paramètres accessibles dans les deux états", () => {
    expect(hrefs(anonymous)).toContain("/parametres");
    expect(hrefs(full)).toContain("/parametres");
  });

  it("n’expose une section que sur une permission effective, jamais un rôle", () => {
    const reader = { permissions: new Set(["session.play"]), authenticated: true };
    expect(hrefs(reader)).toContain("/experience");
    expect(hrefs(reader)).not.toContain("/studio");
    expect(hrefs(reader)).not.toContain("/administration");
    expect(hrefs(full)).toEqual(["/experience", "/library", "/studio", "/administration", "/plateforme", "/parametres"]);
  });
});

describe("isActiveLink", () => {
  it("n’active la racine que sur la racine", () => {
    expect(isActiveLink("/", "/")).toBe(true);
    expect(isActiveLink("/library", "/")).toBe(false);
  });

  it("active une section sur ses sous-routes", () => {
    expect(isActiveLink("/library/abc", "/library")).toBe(true);
    expect(isActiveLink("/libraryother", "/library")).toBe(false);
  });
});
