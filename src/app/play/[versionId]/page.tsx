import type { Metadata } from "next";
import { ConnectedPlayer } from "@/features/player/ui/connected-player";

export const metadata: Metadata = { title: "Jouer" };

export default async function ConnectedPlayerPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  return <ConnectedPlayer scenarioVersionId={versionId} />;
}
