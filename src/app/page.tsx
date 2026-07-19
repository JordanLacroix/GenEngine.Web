import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/shared/api/genengine-server";
import { AccountGate } from "@/features/identity/ui/account-gate";

export const metadata: Metadata = { title: "Connexion" };

/**
 * L'atterrissage est la connexion.
 *
 * La présentation commerciale n'a pas disparu : elle vit sur `/plateforme` et
 * reste accessible depuis le menu et depuis la marque. Une session ouverte n'a
 * rien à faire sur un seuil déjà franchi.
 */
export default async function EntryPage() {
  if (await isAuthenticated()) redirect("/experience");
  return <AccountGate demoEnabled />;
}
