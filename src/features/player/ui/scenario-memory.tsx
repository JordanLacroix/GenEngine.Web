"use client";

import { ArrowLeft, LoaderCircle, Route } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlayerExperienceContract, ScenarioMasteryContract, SessionStateContract } from "@/shared/api/contracts";
import type { QuestTreeInput } from "@/features/player/model/quest-graph";
import { QuestGraphView } from "@/features/player/ui/quest-graph-view";

/**
 * Scenario memory outside a run.
 *
 * Play exposes the narrative structure through `GET /sessions/{id}/tree` only:
 * without a session there is no structure to draw. The last session opened on
 * this device is therefore reused when it exists, and the screen degrades to the
 * cumulative counters otherwise. No new backend endpoint is invented.
 */
export function ScenarioMemory({ scenarioVersionId }: { scenarioVersionId: string }) {
  const [title, setTitle] = useState("Histoire GenEngine");
  const [tree, setTree] = useState<QuestTreeInput>();
  const [mastery, setMastery] = useState<ScenarioMasteryContract>();
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    const sessionId = window.localStorage.getItem(`genengine.session.${scenarioVersionId}`);

    void Promise.all([
      fetch("/api/catalog", { signal: controller.signal })
        .then((response) => response.ok ? response.json() as Promise<Array<{ id: string; title: string }>> : [])
        .then((stories) => setTitle(stories.find((story) => story.id === scenarioVersionId)?.title ?? "Histoire GenEngine")),
      fetch("/api/me", { cache: "no-store", signal: controller.signal })
        .then((response) => response.ok ? response.json() as Promise<{ player: PlayerExperienceContract }> : undefined)
        .then((context) => setMastery(context?.player.masteries.find((item) => item.scenarioVersionId === scenarioVersionId))),
      sessionId
        ? fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, { cache: "no-store", signal: controller.signal })
          .then((response) => response.ok ? response.json() as Promise<SessionStateContract> : undefined)
          .then((state) => setTree(state?.tree))
        : Promise.resolve(),
    ])
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(asMessage(error)); })
      .finally(() => setBusy(false));

    return () => controller.abort();
  }, [scenarioVersionId]);

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
        caption="Le récit entier tel que le moteur le décrit, avec la mémoire cumulée de toutes vos parties."
      />}

      {!busy && !tree && <section className="quest-graph quest-graph--empty">
        <p>La structure de ce récit est fournie par une session de jeu. Ouvrez l’histoire une fois pour afficher la carte complète : votre mémoire cumulée y sera reportée.</p>
        <Link className="button button--primary" href={`/play/${encodeURIComponent(scenarioVersionId)}`}>Ouvrir l’histoire</Link>
      </section>}
    </div>
  );
}

function asMessage(error: unknown) { return error instanceof Error ? error.message : "Votre mémoire n’a pas pu être consultée."; }
