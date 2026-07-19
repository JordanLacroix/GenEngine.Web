import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import type { UserAccessContract } from "@/shared/api/contracts";
import { genEngineRequest, isAuthenticated } from "@/shared/api/genengine-server";
import { AccountGate } from "@/features/identity/ui/account-gate";
import { primaryDestination } from "@/shared/ui/navigation-model";
import { applicationNameOf, fetchClientBootstrap } from "@/shared/api/client-bootstrap";

/**
 * Le gabarit `%s · <instance>` de la coque **ne s'applique pas ici** : dans
 * l'App Router, `title.template` ne vaut que pour les segments *enfants*, et
 * `app/page.tsx` partage le segment de `app/layout.tsx`. Sans cette fonction,
 * l'écran d'entrée — le premier que voit un visiteur — serait le seul à ne
 * porter aucun nom d'instance.
 */
export async function generateMetadata(): Promise<Metadata> {
  return { title: `Connexion · ${applicationNameOf(await fetchClientBootstrap())}` };
}

/**
 * L'atterrissage est la connexion.
 *
 * La présentation commerciale n'a pas disparu : elle vit sur `/plateforme` et
 * reste accessible depuis le menu et depuis la marque. Une session ouverte n'a
 * rien à faire sur un seuil déjà franchi.
 *
 * La destination dépend des permissions effectives, pas d'une hypothèse :
 * `/experience` n'est atteignable qu'avec `session.play`, et y renvoyer un
 * compte d'auteur ou d'administration pur l'envoyait sur un écran hors de sa
 * portée. Un jeton présent mais refusé par Identity ramène au formulaire —
 * c'est plus utile qu'une redirection vers un écran qui échouera.
 */
export default async function EntryPage() {
  if (await isAuthenticated()) {
    const access = await genEngineRequest<UserAccessContract>("identity", "/me").catch(() => undefined);
    if (access) redirect(primaryDestination(new Set(access.permissions)) as Route);
  }
  return <AccountGate demoEnabled />;
}
