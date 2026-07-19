import type { PublishedExperienceContract } from "@/shared/api/contracts";
import { genEngineRequest, isAuthenticated } from "@/shared/api/genengine-server";
import { HomeExperience } from "@/features/home/ui/home-experience";
import { StoryIntro } from "@/features/experience/ui/story-intro";

export default async function DiscoverPage() {
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
