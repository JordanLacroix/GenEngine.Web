"use client";

import { createContext, useContext } from "react";

/**
 * Le nom d'instance connu **dès le rendu serveur**.
 *
 * `useNavigationContext` lit la marque via `/api/me` et `/api/experience`, deux
 * appels qui ne partent qu'après l'hydratation. Jusque-là, tout porteur de
 * marque — la barre latérale de l'Administration, celle du Studio, l'écran des
 * paramètres — rendait le repli « GenEngine ». L'opérateur lisait donc le nom
 * du **moteur** dans le HTML servi, puis le voyait basculer sur celui de sa
 * configuration.
 *
 * `GET /client-bootstrap/{frontId}` est anonyme précisément pour éviter ça :
 * le layout la lit côté serveur et sème le nom ici. Le repli reste inchangé —
 * une instance sans marque publiée rend exactement comme avant.
 *
 * Ce contexte ne porte **que** la marque. Il ne remplace pas
 * `useNavigationContext`, qui reste la source des permissions et du document.
 */
const PublishedBrandContext = createContext<string | undefined>(undefined);

export function PublishedBrandProvider({ applicationName, children }: {
  applicationName?: string;
  children: React.ReactNode;
}) {
  return <PublishedBrandContext.Provider value={applicationName}>{children}</PublishedBrandContext.Provider>;
}

/** Le nom publié semé par le serveur, ou `undefined` si aucune marque n'est publiée. */
export function usePublishedBrand(): string | undefined {
  return useContext(PublishedBrandContext);
}
