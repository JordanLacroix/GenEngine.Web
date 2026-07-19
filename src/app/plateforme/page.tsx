import type { Metadata } from "next";
import type { PublishedExperienceContract } from "@/shared/api/contracts";
import { genEngineRequest, isAuthenticated } from "@/shared/api/genengine-server";
import { HomeExperience } from "@/features/home/ui/home-experience";
import { StoryIntro } from "@/features/experience/ui/story-intro";

export const metadata: Metadata = { title: "La plateforme" };

/**
 * Présentation de la plateforme.
 *
 * Elle occupait l'atterrissage `/` ; la connexion l'y a remplacée. Le contenu
 * garde sa valeur commerciale et reste atteignable depuis le menu, depuis la
 * marque de l'en-tête et depuis le seuil de connexion.
 */
export default async function PlatformPage() {
  const [authenticated, experience] = await Promise.all([
    isAuthenticated(),
    genEngineRequest<PublishedExperienceContract>("configuration", "/experience/default", {}, false)
      .catch(() => undefined),
  ]);
  return <>
    {/* L'introduction narrative reste réservée aux visiteurs : une personne déjà
        connectée a franchi ce seuil et retrouve directement son univers. */}
    {!authenticated && <StoryIntro experience={experience} />}
    <HomeExperience authenticated={authenticated} />
  </>;
}
