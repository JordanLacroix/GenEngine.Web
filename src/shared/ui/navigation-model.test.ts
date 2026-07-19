import { describe, expect, it } from "vitest";
import { buildNavigationLinks, hasOwnNavigation, isActiveLink, primaryDestination } from "./navigation-model";

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

describe("primaryDestination", () => {
  it("envoie vers l’univers quand la personne peut jouer", () => {
    expect(primaryDestination(new Set(["session.play"]))).toBe("/experience");
  });

  it("n’envoie pas un compte sans `session.play` sur un écran hors de sa portée", () => {
    // `/experience` n'est proposé qu'avec `session.play` : y rediriger un
    // compte d'auteur ou d'administration pur créait une impasse.
    expect(primaryDestination(new Set(["scenario.author"]))).not.toBe("/experience");
    expect(primaryDestination(new Set(["config.read"]))).not.toBe("/experience");
  });

  it("retombe sur une destination qui n’exige aucune permission", () => {
    expect(primaryDestination(new Set())).toBe("/library");
  });

  it("ne propose jamais qu’une destination réellement offerte par le menu", () => {
    for (const permissions of [new Set<string>(), new Set(["session.play"]), new Set(["config.read"])]) {
      const offered = buildNavigationLinks({ permissions, authenticated: true }).map((link) => link.href);
      expect(offered).toContain(primaryDestination(permissions));
    }
  });
});
