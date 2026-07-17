import { NextResponse } from "next/server";
import { GenEngineServerError } from "@/shared/api/genengine-server";

export function apiError(error: unknown) {
  if (error instanceof GenEngineServerError) {
    return NextResponse.json(
      { title: error.problem?.title ?? "genengine_error", detail: error.message, status: error.status },
      { status: error.status },
    );
  }
  return NextResponse.json({ title: "gateway_error", detail: error instanceof Error ? error.message : "Service unavailable" }, { status: 502 });
}
