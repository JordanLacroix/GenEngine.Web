import { permanentRedirect } from "next/navigation";

/**
 * Le seuil de connexion a rejoint l'atterrissage `/`.
 *
 * La route reste en place pour que les liens déjà distribués — courriels
 * d'invitation, favoris — continuent d'aboutir.
 */
export default function AccountPage() {
  permanentRedirect("/");
}
