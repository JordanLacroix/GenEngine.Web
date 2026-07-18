import { NextResponse } from "next/server";
import type { OnboardingStateContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action: "complete" | "skip" | "reset"; stepId?: string; idempotencyKey?: string };
    const path = body.action === "complete"
      ? `/me/experience/onboarding/steps/${encodeURIComponent(body.stepId ?? "")}/complete?frontId=default`
      : `/me/experience/onboarding/${body.action}?frontId=default`;
    return NextResponse.json(await genEngineRequest<OnboardingStateContract>("playerExperience", path, {
      method: "POST",
      body: body.action === "reset" ? undefined : JSON.stringify({ idempotencyKey: body.idempotencyKey ?? crypto.randomUUID() }),
    }));
  } catch (error) { return apiError(error); }
}
