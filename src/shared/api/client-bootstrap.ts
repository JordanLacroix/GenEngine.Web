import "server-only";
import type { ClientBootstrapContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { fallbackApplicationName } from "@/shared/ui/branding-theme";

/**
 * `GET /client-bootstrap/{frontId}` — la charge utile anonyme de démarrage.
 *
 * Elle est **faite pour ça** : un client doit pouvoir peindre son premier
 * écran avant de détenir le moindre jeton. Elle est donc lue sans
 * authentification, et son échec ne casse rien — il fait retomber l'interface
 * sur « GenEngine », qui est le nom du moteur et non celui d'une instance.
 *
 * Le repli est **annoncé, pas simulé** : on ne fabrique ni thème ni palette
 * localement (invariant 14). Un `undefined` signifie « pas de marque publiée »,
 * et chaque consommateur en tire la conséquence littérale.
 */
export const defaultFrontId = "default";

export async function fetchClientBootstrap(frontId = defaultFrontId): Promise<ClientBootstrapContract | undefined> {
  try {
    // `genEngineRequest` impose `cache: "no-store"` : la marque est relue à
    // chaque rendu, comme le reste de la configuration. Une republication est
    // donc visible au rechargement suivant, sans invalidation à gérer.
    return await genEngineRequest<ClientBootstrapContract>(
      "configuration",
      `/client-bootstrap/${encodeURIComponent(frontId)}`,
      {},
      false,
    );
  } catch {
    return undefined;
  }
}

/** Nom d'application effectif, repli compris. */
export function applicationNameOf(bootstrap: ClientBootstrapContract | undefined): string {
  return bootstrap?.branding?.applicationName?.trim()
    || bootstrap?.applicationName?.trim()
    || fallbackApplicationName;
}

/** Nom court effectif — celui qui tient dans un onglet ou une pastille. */
export function shortNameOf(bootstrap: ClientBootstrapContract | undefined): string {
  return bootstrap?.branding?.shortName?.trim()
    || bootstrap?.shortName?.trim()
    || applicationNameOf(bootstrap);
}
