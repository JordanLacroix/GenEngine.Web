import type { Metadata } from "next";
import { ScenarioMemory } from "@/features/player/ui/scenario-memory";

export const metadata: Metadata = { title: "Mémoire du récit" };

export default async function ScenarioMemoryPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  return <ScenarioMemory scenarioVersionId={versionId} />;
}
