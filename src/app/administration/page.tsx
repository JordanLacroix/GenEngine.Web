import type { Metadata } from "next";
import { AdministrationConsole } from "@/features/administration/ui/administration-console";

export const metadata: Metadata = { title: "Administration" };

/**
 * Plein écran à HUD, comme le reste de l'application.
 *
 * Le titre pleine hauteur qui précédait la console a disparu : sur une surface
 * dense, la hauteur appartient au tableau, et l'intitulé de la section vit
 * dans la barre latérale — qui porte aussi la navigation globale.
 */
export default function AdministrationPage() {
  return <AdministrationConsole />;
}
