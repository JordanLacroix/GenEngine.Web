/**
 * Sessions commencées **sur cet appareil**.
 *
 * Le lecteur enregistre l'identifiant de session sous
 * `genengine.session.{scenarioVersionId}`. Énumérer ces clés donne la liste
 * exacte des versions commencées, sans dépendre du catalogue : c'est ce qui
 * permet à la bibliothèque de rester juste alors qu'elle n'affiche qu'une page
 * du catalogue à la fois.
 *
 * Ce n'est pas une source d'autorité : le serveur reste seul juge de la
 * progression réelle. C'est un repère de présentation, local et jetable.
 */

export const sessionStorageKeyPrefix = "genengine.session.";

/** Borne le nombre de reprises résolues, pour ne pas dégénérer sur un appareil très utilisé. */
export const maximumTrackedSessions = 100;

export function sessionStorageKey(scenarioVersionId: string): string {
  return `${sessionStorageKeyPrefix}${scenarioVersionId}`;
}

/** Identifiants de version pour lesquels une session est mémorisée sur cet appareil. */
export function readStartedVersionIds(storage: Pick<Storage, "length" | "key"> | undefined): string[] {
  if (!storage) return [];
  const identifiers: string[] = [];
  for (let index = 0; index < storage.length && identifiers.length < maximumTrackedSessions; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(sessionStorageKeyPrefix)) {
      const versionId = key.slice(sessionStorageKeyPrefix.length);
      if (versionId) identifiers.push(versionId);
    }
  }
  return identifiers;
}
