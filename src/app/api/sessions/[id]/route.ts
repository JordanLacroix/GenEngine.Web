import { NextResponse } from "next/server";
import type { CurrentStepContract, InputResultContract, NarrativeTreeContract, SessionContract, SessionStateContract } from "@/shared/api/contracts";
import { genEngineRequest } from "@/shared/api/genengine-server";
import { apiError } from "@/shared/api/route-errors";

interface RouteContext { params: Promise<{ id: string }> }
type CommandBody = { kind: "choice" | "continue" | "consult" | "answer" | "text" | "confirm" | "pause" | "resume"; commandId?: string; expectedRevision: number; value?: string | boolean };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const path = `/sessions/${encodeURIComponent(id)}`;
    const [session, currentStep, tree] = await Promise.all([
      genEngineRequest<SessionContract>("play", path),
      genEngineRequest<CurrentStepContract>("play", `${path}/current-step`),
      genEngineRequest<NarrativeTreeContract>("play", `${path}/tree`),
    ]);
    return NextResponse.json({ session, currentStep, tree } satisfies SessionStateContract);
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as CommandBody;
    const base = `/sessions/${encodeURIComponent(id)}`;
    if (body.kind === "pause" || body.kind === "resume") {
      const session = await genEngineRequest<SessionContract>("play", `${base}/${body.kind}`, {
        method: "POST",
        body: JSON.stringify({ expectedRevision: body.expectedRevision }),
      });
      return NextResponse.json(session);
    }
    if (!body.commandId) return NextResponse.json({ title: "command_id_required" }, { status: 400 });
    // `consult` porte les mêmes `commandId` et `expectedRevision` que les
    // autres commandes : côté moteur c'est une commande joueur idempotente qui
    // consomme un tour, pas une lecture.
    const endpoint = body.kind === "choice" ? "inputs"
      : body.kind === "answer" ? "answers"
        : body.kind === "text" ? "text-inputs"
          : body.kind === "confirm" ? "text-inputs/confirm"
            : body.kind === "consult" ? "document-consultations"
              : "continue";
    const payload: Record<string, unknown> = { commandId: body.commandId, expectedRevision: body.expectedRevision };
    if (body.kind === "choice") payload.choiceId = body.value;
    if (body.kind === "answer") payload.answerId = body.value;
    if (body.kind === "text") payload.text = body.value;
    if (body.kind === "confirm") payload.confirmed = body.value;
    const result = await genEngineRequest<InputResultContract>("play", `${base}/${endpoint}`, { method: "POST", body: JSON.stringify(payload) });
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}
