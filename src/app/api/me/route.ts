import { NextResponse } from "next/server";
import type { PlayerBootstrapContract, PlayerOrganizationContextContract, PublishedExperienceContract, UserAccessContract, UserContextContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function GET() {
  try {
    const [access, publishedExperience, bootstrap, organization] = await Promise.all([
      genEngineRequest<UserAccessContract>("identity", "/me"),
      genEngineRequest<PublishedExperienceContract>("configuration", "/experience/default", {}, false),
      genEngineRequest<PlayerBootstrapContract>("playerExperience", "/me/experience/bootstrap?frontId=default"),
      genEngineRequest<PlayerOrganizationContextContract>("organization", "/me/organization/default"),
    ]);
    const experience = organization.hasGlobalScope ? publishedExperience : filterAssignedCatalog(publishedExperience, organization);
    return NextResponse.json({ access, experience, player: bootstrap.experience, bootstrap } satisfies UserContextContract & { bootstrap: PlayerBootstrapContract });
  } catch (error) { return apiError(error); }
}

function filterAssignedCatalog(experience: PublishedExperienceContract, organization: PlayerOrganizationContextContract): PublishedExperienceContract {
  const journeyIds = new Set(organization.assignments.filter((item) => item.contentType === "Journey").map((item) => item.contentId));
  const categoryIds = new Set(organization.assignments.filter((item) => item.contentType === "Category").map((item) => item.contentId));
  const scenarioIds = new Set(organization.assignments.filter((item) => item.contentType === "Scenario").map((item) => item.contentId));
  for (const journey of experience.document.journeys) if (journeyIds.has(journey.id)) for (const categoryId of journey.categoryIds) categoryIds.add(categoryId);
  for (const category of experience.document.categories) if (category.scenarioIds.some((id) => scenarioIds.has(id))) categoryIds.add(category.id);
  const categories = experience.document.categories.filter((category) => categoryIds.has(category.id));
  const visibleIds = new Set(categories.map((category) => category.id));
  const journeys = experience.document.journeys.filter((journey) => journeyIds.has(journey.id) || journey.categoryIds.some((id) => visibleIds.has(id)));
  return { ...experience, document: { ...experience.document, categories, journeys } };
}
