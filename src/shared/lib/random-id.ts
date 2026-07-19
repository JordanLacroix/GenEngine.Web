/**
 * Identifiant aléatoire utilisable hors contexte sécurisé.
 *
 * `crypto.randomUUID` n'est exposé qu'en *secure context* : sur
 * `http://intranet.local`, il est `undefined` et l'appel lève. Or ce client se
 * déploie explicitement en HTTP sur des hôtes d'intranet — l'écran de
 * configuration des services propose `http` comme schéma par défaut.
 *
 * `crypto.getRandomValues`, lui, est disponible en contexte non sécurisé. La
 * qualité aléatoire est donc préservée, ce qui compte pour les clés
 * d'idempotence envoyées au moteur. Le repli `Math.random` ne sert qu'aux
 * environnements sans Web Crypto du tout ; il reste suffisant pour une clé de
 * liste, et n'est jamais employé pour un secret — le client n'en manipule pas.
 */
export function randomId(): string {
  const bytes = new Uint8Array(16);
  const webCrypto = globalThis.crypto;
  if (webCrypto?.getRandomValues) webCrypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);

  // Format UUID v4, parce que le moteur attend cette forme pour une clé
  // d'idempotence et qu'un identifiant maison serait refusé.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
