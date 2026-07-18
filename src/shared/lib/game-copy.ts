import type { ExperienceDocumentContract } from "@/shared/api/contracts";

export function gameCopy(document: ExperienceDocumentContract | undefined, key: string, fallback: string): string {
  const value = document?.language.labels[key]?.trim();
  return value || fallback;
}
