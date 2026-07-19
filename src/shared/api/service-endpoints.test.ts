import { describe, expect, it } from "vitest";
import {
  allowedHostFor, assertHostsAllowed, defaultAllowedHosts, hostForUrl, defaultGroupedEndpoints, endpointUrl, endpointUrls,
  EndpointValidationError, isHostAllowed, normalizeServiceUrl, parseAllowedHosts,
  parseEndpointOverride, readEndpointOverride, serializeEndpointOverride,
  serviceDescriptors, serviceIds,
} from "./service-endpoints";

describe("descripteurs de services", () => {
  it("couvre les six services du client", () => {
    expect(serviceDescriptors.map((descriptor) => descriptor.id)).toEqual([...serviceIds]);
    expect(serviceIds).toHaveLength(6);
  });

  it("garde la convention de ports 5201 à 5206", () => {
    expect(Object.fromEntries(serviceDescriptors.map((item) => [item.id, item.defaultPort]))).toEqual({
      authoring: 5201, play: 5202, identity: 5203,
      configuration: 5204, playerExperience: 5205, organization: 5206,
    });
  });

  it("ne déclare aucune variable exposée au navigateur", () => {
    for (const descriptor of serviceDescriptors) {
      expect(descriptor.envVariable.startsWith("NEXT_PUBLIC_")).toBe(false);
    }
  });
});

describe("normalizeServiceUrl", () => {
  it("ramène une adresse à son origine", () => {
    expect(normalizeServiceUrl(" http://localhost:5201/ ")).toBe("http://localhost:5201");
    expect(normalizeServiceUrl("http://localhost:5201")).toBe("http://localhost:5201");
  });

  it("refuse un chemin de base plutôt que de le perdre en silence", () => {
    // La façade appelle `new URL("/auth/login", base)` : un chemin absolu
    // remplace celui de la base. L'accepter produirait un écran qui ment.
    expect(() => normalizeServiceUrl("http://localhost:8080/authoring")).toThrow(/chemin de base/);
    expect(() => normalizeServiceUrl("http://localhost:8080/authoring/")).toThrow(/chemin de base/);
  });

  it("refuse une requête ou une ancre", () => {
    expect(() => normalizeServiceUrl("http://localhost:5201?a=1")).toThrow(EndpointValidationError);
    expect(() => normalizeServiceUrl("http://localhost:5201#x")).toThrow(EndpointValidationError);
  });

  it("accepte une adresse IPv6 littérale et conserve ses crochets", () => {
    expect(normalizeServiceUrl("http://[::1]:5203")).toBe("http://[::1]:5203");
  });

  it("refuse un schéma qui n’est pas http ou https", () => {
    expect(() => normalizeServiceUrl("file:///etc/passwd")).toThrow(EndpointValidationError);
    expect(() => normalizeServiceUrl("javascript:alert(1)")).toThrow(EndpointValidationError);
  });

  it("refuse un identifiant embarqué dans l’URL", () => {
    expect(() => normalizeServiceUrl("https://user:secret@moteur.example")).toThrow(EndpointValidationError);
  });

  it("refuse une saisie vide ou non analysable", () => {
    expect(() => normalizeServiceUrl("   ")).toThrow(EndpointValidationError);
    expect(() => normalizeServiceUrl("moteur.example:5201")).toThrow(EndpointValidationError);
  });
});

describe("parseEndpointOverride", () => {
  it("accepte un mode groupé complet", () => {
    const parsed = parseEndpointOverride({
      mode: "grouped", scheme: "https", host: "moteur.example",
      ports: { authoring: 1, play: 2, identity: 3, configuration: 4, playerExperience: 5, organization: 6 },
    });
    expect(endpointUrl(parsed, "identity")).toBe("https://moteur.example:3");
  });

  it("accepte un mode unitaire et normalise chaque URL", () => {
    const urls = Object.fromEntries(serviceIds.map((id) => [id, `https://${id}.example/`]));
    const parsed = parseEndpointOverride({ mode: "unit", urls });
    expect(endpointUrls(parsed).play).toBe("https://play.example");
  });

  it("refuse un port hors bornes", () => {
    expect(() => parseEndpointOverride({
      ...defaultGroupedEndpoints,
      ports: { ...defaultGroupedEndpoints.ports, play: 70_000 },
    })).toThrow(EndpointValidationError);
  });

  it("refuse un hôte qui contient un chemin", () => {
    expect(() => parseEndpointOverride({ ...defaultGroupedEndpoints, host: "moteur.example/api" }))
      .toThrow(EndpointValidationError);
  });

  it("refuse un service manquant en mode unitaire", () => {
    const urls = Object.fromEntries(serviceIds.slice(1).map((id) => [id, "https://moteur.example"]));
    expect(() => parseEndpointOverride({ mode: "unit", urls })).toThrow(EndpointValidationError);
  });

  it("refuse un mode inconnu plutôt que de l’interpréter", () => {
    expect(() => parseEndpointOverride({ mode: "auto" })).toThrow(EndpointValidationError);
    expect(() => parseEndpointOverride(null)).toThrow(EndpointValidationError);
  });
});

describe("readEndpointOverride", () => {
  it("relit ce qui a été sérialisé", () => {
    const raw = serializeEndpointOverride(defaultGroupedEndpoints);
    expect(readEndpointOverride(raw)).toEqual(defaultGroupedEndpoints);
  });

  it("ignore une valeur absente ou corrompue au lieu d’échouer", () => {
    expect(readEndpointOverride(undefined)).toBeUndefined();
    expect(readEndpointOverride("{pas du json")).toBeUndefined();
    expect(readEndpointOverride('{"mode":"grouped"}')).toBeUndefined();
  });
});

describe("endpointUrl par défaut", () => {
  it("reproduit la convention locale", () => {
    expect(endpointUrls(defaultGroupedEndpoints)).toEqual({
      authoring: "http://localhost:5201",
      play: "http://localhost:5202",
      identity: "http://localhost:5203",
      configuration: "http://localhost:5204",
      playerExperience: "http://localhost:5205",
      organization: "http://localhost:5206",
    });
  });
});

describe("liste d’hôtes autorisés", () => {
  it("retombe sur la convention locale quand rien n’est déclaré", () => {
    expect(parseAllowedHosts(undefined)).toEqual(defaultAllowedHosts);
    expect(parseAllowedHosts("   ")).toEqual(defaultAllowedHosts);
  });

  it("lit une déclaration séparée par des virgules, sans casse ni espaces", () => {
    expect(parseAllowedHosts(" Moteur.Example , 10.0.0.4 ")).toEqual(["moteur.example", "10.0.0.4"]);
  });

  it("accepte un hôte déclaré, quelle que soit la casse", () => {
    expect(isHostAllowed("Localhost", defaultAllowedHosts)).toBe(true);
    expect(isHostAllowed("127.0.0.1", defaultAllowedHosts)).toBe(true);
  });

  it("compare une adresse IPv6 sans ses crochets", () => {
    expect(isHostAllowed("[::1]", defaultAllowedHosts)).toBe(true);
  });

  it("refuse tout hôte non déclaré", () => {
    expect(isHostAllowed("attaquant.example", defaultAllowedHosts)).toBe(false);
    expect(isHostAllowed("169.254.169.254", defaultAllowedHosts)).toBe(false);
    expect(isHostAllowed("localhost.attaquant.example", defaultAllowedHosts)).toBe(false);
  });

  it("n’offre aucun joker : un astérisque n’est qu’un hôte qui ne correspond à rien", () => {
    expect(isHostAllowed("attaquant.example", ["*"])).toBe(false);
  });

  it("rend l’entrée déclarée, pour que l’appelant recompose l’URL sans la valeur reçue", () => {
    expect(allowedHostFor("LOCALHOST", defaultAllowedHosts)).toBe("localhost");
    expect(allowedHostFor("attaquant.example", defaultAllowedHosts)).toBeUndefined();
  });
});

describe("assertHostsAllowed", () => {
  it("laisse passer la convention locale", () => {
    expect(() => assertHostsAllowed(defaultGroupedEndpoints, defaultAllowedHosts)).not.toThrow();
  });

  it("refuse dès qu’un seul service sort de la liste", () => {
    const urls = Object.fromEntries(serviceIds.map((id) => [id, "http://localhost:5201"]));
    urls.play = "https://169.254.169.254";
    const override = parseEndpointOverride({ mode: "unit", urls });
    expect(() => assertHostsAllowed(override, defaultAllowedHosts)).toThrow(EndpointValidationError);
  });

  it("refuse un hôte groupé non déclaré", () => {
    const override = parseEndpointOverride({ ...defaultGroupedEndpoints, host: "attaquant.example" });
    expect(() => assertHostsAllowed(override, defaultAllowedHosts)).toThrow(/n’est pas autorisé/);
  });
});

describe("recomposition d’un hôte dans une URL", () => {
  it("rhabille une adresse IPv6 de ses crochets", () => {
    expect(hostForUrl("::1")).toBe("[::1]");
    expect(hostForUrl("[::1]")).toBe("[::1]");
    expect(hostForUrl("fe80::1")).toBe("[fe80::1]");
  });

  it("laisse un nom ou une adresse IPv4 intacts", () => {
    expect(hostForUrl("localhost")).toBe("localhost");
    expect(hostForUrl("127.0.0.1")).toBe("127.0.0.1");
  });

  it("produit une base que `new URL` sait combiner — le défaut qui cassait tout", () => {
    // `http://::1:5203` n'est pas une URL : chaque appel au service levait un
    // `TypeError` rendu en 502, alors que `::1` est dans la liste par défaut.
    for (const host of defaultAllowedHosts) {
      const base = `http://${hostForUrl(host)}:5203`;
      expect(() => new URL("/auth/login", base)).not.toThrow();
      expect(new URL("/auth/login", base).pathname).toBe("/auth/login");
    }
  });
});

describe("mode groupé et IPv6", () => {
  it("accepte une adresse IPv6 saisie sans crochets et compose une URL valide", () => {
    const override = parseEndpointOverride({ ...defaultGroupedEndpoints, host: "::1" });
    expect(endpointUrl(override, "identity")).toBe("http://[::1]:5203");
    expect(() => new URL("/me", endpointUrl(override, "identity"))).not.toThrow();
  });

  it("laisse passer le contrôle d’hôte pour cette adresse", () => {
    const override = parseEndpointOverride({ ...defaultGroupedEndpoints, host: "[::1]" });
    expect(() => assertHostsAllowed(override, defaultAllowedHosts)).not.toThrow();
  });

  it("refuse un hôte irrecomposable par une erreur de validation, pas un TypeError", () => {
    // Le message doit rester actionnable : un `TypeError` ressortait en 400
    // « Configuration illisible », ce qui n'aide personne.
    expect(() => parseEndpointOverride({ ...defaultGroupedEndpoints, host: "1:2:3" }))
      .toThrow(EndpointValidationError);
    expect(() => parseEndpointOverride({ ...defaultGroupedEndpoints, host: "g::1" }))
      .toThrow(EndpointValidationError);
  });

  it("compose une URL valide pour chaque hôte de la liste par défaut", () => {
    for (const host of defaultAllowedHosts) {
      const override = parseEndpointOverride({ ...defaultGroupedEndpoints, host });
      for (const id of serviceIds) {
        expect(() => new URL("/health", endpointUrl(override, id))).not.toThrow();
      }
      expect(() => assertHostsAllowed(override, defaultAllowedHosts)).not.toThrow();
    }
  });
});
