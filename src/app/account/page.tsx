import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/shared/api/genengine-server";
import { AccountGate } from "@/features/identity/ui/account-gate";

export const metadata: Metadata = { title: "Connexion" };

/**
 * Seuil de connexion. Une session ouverte n'a rien à faire ici, et la
 * démonstration n'est proposée qu'aux personnes encore anonymes.
 */
export default async function AccountPage() {
  if (await isAuthenticated()) redirect("/experience");
  return <AccountGate demoEnabled />;
}
