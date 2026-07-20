import { NextResponse } from "next/server";
import { fetchFieldDescriptors } from "@/shared/api/field-descriptors";
import { GenEngineServerError, isAuthenticated } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

/**
 * L'aide par champ, telle que le moteur la publie.
 *
 * La réponse est mise en cache côté serveur — 202 descripteurs n'ont pas à
 * repartir sur le réseau à chaque rendu. La session reste exigée ici : le cache
 * ne doit pas devenir un contournement de `config.read`. Le refus qui fait
 * autorité reste celui du service Configuration, et il est rendu tel quel.
 */
export async function GET() {
  try {
    if (!await isAuthenticated()) {
      throw new GenEngineServerError(401, {
        title: "authentication_required",
        detail: "Connectez-vous pour consulter l’aide de configuration.",
      });
    }
    return NextResponse.json(await fetchFieldDescriptors());
  } catch (error) { return apiError(error); }
}
