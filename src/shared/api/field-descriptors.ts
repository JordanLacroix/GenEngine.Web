import "server-only";
import type { FieldDescriptorContract } from "@/shared/api/contracts";
import { genEngineRequest, resolveServiceUrl } from "@/shared/api/genengine-server";

/**
 * Aide par champ servie par le moteur.
 *
 * `GET /admin/configuration/field-descriptors` documente les 202 champs du
 * document d'expérience. Ces textes sont maintenus **côté moteur**, avec un
 * test de complétude bidirectionnel ; les recopier ici les ferait diverger au
 * premier changement de schéma. Le client les lit, les met en cache, et ne les
 * réécrit jamais.
 *
 * Le cache est nécessaire, pas cosmétique : sans lui, chaque frappe dans un
 * formulaire de l'Administration rechargerait 202 descripteurs. Il est mémoire
 * de processus et daté, donc une republication du moteur est reprise au plus
 * tard après `cacheTtlMs`.
 *
 * Il est **cloisonné par URL de service résolue** : une surcharge de session
 * qui vise un autre moteur ne doit jamais lire l'aide du précédent.
 *
 * Ce cache ne remplace **aucune** autorisation. La route qui l'expose exige une
 * session, et le premier remplissage passe par le moteur, qui applique
 * `config.read`. Un descripteur est de la documentation de schéma — ni donnée
 * d'organisation, ni valeur configurée — mais le contrôle reste côté serveur
 * propriétaire (invariant 10).
 */

const cacheTtlMs = 5 * 60_000;

interface CacheEntry {
  readonly at: number;
  readonly value: readonly FieldDescriptorContract[];
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<readonly FieldDescriptorContract[]>>();

/** Vide le cache. Réservé aux tests : rien en production ne doit l'appeler. */
export function clearFieldDescriptorCache(): void {
  cache.clear();
  inflight.clear();
}

/**
 * Les descripteurs de l'instance visée, cache compris.
 *
 * Les requêtes concurrentes partagent un seul appel réseau : au premier rendu
 * de l'Administration et du Studio, plusieurs onglets demandent la même liste.
 */
export async function fetchFieldDescriptors(): Promise<readonly FieldDescriptorContract[]> {
  const key = await resolveServiceUrl("configuration");

  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < cacheTtlMs) return cached.value;

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = genEngineRequest<FieldDescriptorContract[]>(
    "configuration",
    "/admin/configuration/field-descriptors",
  ).then((value) => {
    // Une réponse qui n'est pas une liste n'est pas celle qu'on croit : on la
    // laisse remonter en erreur plutôt que de mettre en cache un objet vide qui
    // ferait taire l'aide pendant cinq minutes.
    if (!Array.isArray(value)) throw new Error("Réponse inattendue pour les descripteurs de champs.");
    cache.set(key, { at: Date.now(), value });
    return value as readonly FieldDescriptorContract[];
  }).finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
}
