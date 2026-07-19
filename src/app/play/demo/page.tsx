import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/shared/api/genengine-server";
import { DemoPlayer } from "@/features/player/ui/demo-player";

export const metadata: Metadata = { title: "Démonstration" };

/**
 * La démonstration s'adresse aux visiteurs anonymes. Une personne connectée
 * dispose déjà de son univers : l'y renvoyer évite de lui proposer un parcours
 * hors ligne dont la progression ne serait pas conservée.
 */
export default async function DemoPlayerPage() {
  if (await isAuthenticated()) redirect("/experience");
  return <DemoPlayer />;
}
