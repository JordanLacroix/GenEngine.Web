"use client";

import { ArrowLeft, LoaderCircle, Route } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PlayerExperienceContract, ProblemDetailsContract, ScenarioMasteryContract, ScenarioStructureContract } from "@/shared/api/contracts";
import { fetchStoryByVersionId } from "@/shared/api/catalog-browser";
import { questTreeFromStructure, type QuestNodeState } from "@/features/player/model/quest-graph";
import { QuestGraphView } from "@/features/player/ui/quest-graph-view";

/**
 * Scenario memory outside a run.
 *
 * Play exposes the topology of a published version through
 * `GET /scenario-versions/{versionId}/tree`, without any session. The map is
 * therefore the real structure, coloured by the cumulative mastery of the
 * player. When the backend refuses the version — unknown, or not assigned to
 * this player — the screen says so; it never falls back to a fixture.
 */

/** Outside a run only these two states can occur. */
const outOfRunLegend: readonly QuestNodeState[] = ["discoveredBefore", "unseen"];

export function ScenarioMemory({ scenarioVersionId }: { scenarioVersionId: string }) {
  const [title, setTitle] = useState("Histoire");
  const [structure, setStructure] = useState<ScenarioStructureContract>();
  const [mastery, setMastery] = useState<ScenarioMasteryContract>();
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      // Un seul titre est nécessaire : il est résolu par identifiant de version,
      // sans rapatrier le catalogue — qui peut compter des milliers d'entrées.
      fetchStoryByVersionId(scenarioVersionId, controller.signal)
        .then((story) => setTitle(story?.title ?? "Histoire"))
        .catch(() => undefined),
      fetch("/api/me", { cache: "no-store", signal: controller.signal })
        .then((response) => response.ok ? response.json() as Promise<{ player: PlayerExperienceContract }> : undefined)
        .then((context) => setMastery(context?.player.masteries.find((item) => item.scenarioVersionId === scenarioVersionId))),
      fetch(`/api/scenario-versions/${encodeURIComponent(scenarioVersionId)}/tree`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          if (response.ok) {
            setStructure(await response.json() as ScenarioStructureContract);
            return;
          }
          const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined;
          setMessage(structureMessage(response.status, problem));
        }),
    ])
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(asMessage(error)); })
      .finally(() => setBusy(false));

    return () => controller.abort();
  }, [scenarioVersionId]);

  const tree = useMemo(() => structure && questTreeFromStructure(structure), [structure]);

  return (
    <div className="page-shell inner-page scenario-memory">
      <header className="page-intro">
        <div>
          <p className="eyebrow eyebrow--accent"><Route size={15} aria-hidden="true" /> Mémoire de vos parcours</p>
          <h1>{title}</h1>
          <p>Toutes vos parties de cette histoire alimentent une même carte. Ce que vous avez découvert reste acquis, partie après partie.</p>
        </div>
        <Link className="button button--quiet" href="/library"><ArrowLeft size={16} aria-hidden="true" /> Retour à la bibliothèque</Link>
      </header>

      {message && <p className="player-error" role="alert">{message}</p>}
      {busy && <p className="empty-state"><LoaderCircle className="spin" aria-hidden="true" /> Consultation de votre mémoire…</p>}

      {!busy && mastery && <p className="scenario-memory-counters">
        <span><b>{mastery.masteryPercent}%</b> de maîtrise</span>
        <span><b>{mastery.nodeIds.length}</b> étape{mastery.nodeIds.length > 1 ? "s" : ""} connue{mastery.nodeIds.length > 1 ? "s" : ""}</span>
        <span><b>{mastery.choiceIds.length}</b> choix essayé{mastery.choiceIds.length > 1 ? "s" : ""}</span>
        <span><b>{mastery.endingIds.length}</b> fin{mastery.endingIds.length > 1 ? "s" : ""} atteinte{mastery.endingIds.length > 1 ? "s" : ""}</span>
      </p>}

      {!busy && tree && <QuestGraphView
        tree={tree}
        masteryNodeIds={mastery?.nodeIds}
        masteryChoiceIds={mastery?.choiceIds}
        legendStates={outOfRunLegend}
        caption="Le récit entier tel que le moteur le décrit, avec la mémoire cumulée de toutes vos parties. Hors partie, la disponibilité des passages n’est pas évaluée."
      />}

      {!busy && !tree && <section className="quest-graph quest-graph--empty">
        <p>La carte de ce récit n’est pas consultable pour le moment.</p>
        <Link className="button button--primary" href="/library">Revenir à la bibliothèque</Link>
      </section>}
    </div>
  );
}

/** Honest wording per backend refusal: no silent fixture, no invented permission. */
function structureMessage(status: number, problem?: ProblemDetailsContract) {
  if (status === 401) return "Connectez-vous pour consulter la carte de ce récit.";
  if (status === 422 && problem?.title === "content_not_assigned") return "Cette histoire ne vous est pas affectée : sa carte reste indisponible.";
  if (status === 403) return "Vous n’êtes pas autorisé à consulter la carte de ce récit.";
  if (status === 404) return "Cette version d’histoire est introuvable.";
  return problem?.detail ?? problem?.title ?? "La structure de ce récit n’a pas pu être chargée.";
}

function asMessage(error: unknown) { return error instanceof Error ? error.message : "Votre mémoire n’a pas pu être consultée."; }
