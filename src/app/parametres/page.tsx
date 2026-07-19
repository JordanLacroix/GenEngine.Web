import type { Metadata } from "next";
import { endpointConfiguration } from "@/shared/api/genengine-server";
import { ServiceEndpointsScreen } from "@/features/settings/ui/service-endpoints-screen";

export const metadata: Metadata = { title: "Paramètres" };

// La surcharge vit dans un cookie : la page se rend à chaque requête, jamais
// une fois pour toutes au build.
export const dynamic = "force-dynamic";

/**
 * Paramètres de connexion au moteur, accessibles **sans être connecté** :
 * régler l'adresse du serveur est ce qu'on fait avant de pouvoir s'y
 * authentifier.
 *
 * L'état est lu côté serveur, parce que c'est le serveur qui appelle réellement
 * les services. Le navigateur n'obtient jamais d'URL de service autrement que
 * par cette route de rendu.
 */
export default async function SettingsPage() {
  return <ServiceEndpointsScreen initial={await endpointConfiguration()} />;
}
