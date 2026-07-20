"use client";

import { ArrowLeft, Bookmark, DoorOpen, Gift, MousePointer2, RotateCcw, Route, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { Route as AppRoute } from "next";
import { useMemo, useState } from "react";
import type { DemoOutcome } from "@/entities/story/model/story";
import { demoStory } from "@/shared/mocks/stories";
import { demoQuestTree, readDemoQuestMemory, rememberDemoQuestSteps, type DemoQuestMemory } from "@/features/player/model/demo-quest-tree";
import type { QuestTreeInput } from "@/features/player/model/quest-graph";
import { QuestGraphView } from "@/features/player/ui/quest-graph-view";
import { useAudio } from "@/shared/audio/audio-provider";
import { cueForDemoOutcome } from "@/shared/audio/audio-signals";
import { AudioToggle } from "@/shared/ui/audio-toggle";

export function DemoPlayer() {
  const { play } = useAudio();
  const [sceneId, setSceneId] = useState(demoStory.openingSceneId);
  const [history, setHistory] = useState<string[]>([]);
  const [interactionDone, setInteractionDone] = useState(false);
  const [choiceHistory, setChoiceHistory] = useState<string[]>([]);
  const [memory, setMemory] = useState<DemoQuestMemory>({ nodeIds: [], choiceIds: [] });
  const scene = useMemo(() => demoStory.scenes.find((candidate) => candidate.id === sceneId) ?? demoStory.scenes[0]!, [sceneId]);
  const completed = scene.choices.length === 0;
  const progress = completed ? 100 : Math.min(92, ((history.length + 1) / 5) * 100);
  const tree = useMemo(() => demoQuestTree(demoStory, scene.id, history), [scene.id, history]);

  function choose(nextSceneId: string) {
    const choice = scene.choices.find((candidate) => candidate.nextSceneId === nextSceneId);
    const path = [...history, scene.id];
    const choices = choice ? [...choiceHistory, choice.id] : choiceHistory;
    setHistory(path);
    setChoiceHistory(choices);
    setSceneId(nextSceneId);
    setInteractionDone(false);
    // Reaching an ending closes the run: merge it into the memory kept on this device.
    const next = demoStory.scenes.find((candidate) => candidate.id === nextSceneId);
    if (next && next.choices.length === 0) {
      setMemory(rememberDemoQuestSteps(readDemoQuestMemory(), [...path, nextSceneId], choices));
      // Le bilan de fin s'affiche dans la foulée : la piste le double.
      play(cueForDemoOutcome(next.outcome ?? "accord"));
    } else {
      play("signature.choice");
    }
  }

  function goBack() {
    const previous = history.at(-1);
    if (!previous) return;
    setSceneId(previous);
    setHistory((current) => current.slice(0, -1));
    setChoiceHistory((current) => current.slice(0, -1));
    setInteractionDone(true);
  }

  function restart() { setMemory(readDemoQuestMemory()); setHistory([]); setChoiceHistory([]); setSceneId(demoStory.openingSceneId); setInteractionDone(false); }

  return (
    <div className="player-shell">
      <header className="player-header">
        <Link href={"/plateforme" as AppRoute} className="icon-button"><ArrowLeft aria-hidden="true" /><span className="sr-only">Quitter le récit</span></Link>
        <div className="player-title"><span>{demoStory.eyebrow}</span><strong>{demoStory.title}</strong></div>
        {/* Ce bouton pilotait un état local sans effet : il affichait un
            réglage sonore qui ne réglait rien. Il cède la place au réglage
            réel de la HUD, qui se désactive quand aucun son n'est jouable. */}
        <div className="player-tools"><AudioToggle /><button type="button" className="icon-button"><Bookmark aria-hidden="true" /><span className="sr-only">Ajouter aux favoris</span></button></div>
      </header>
      <div className="player-progress" aria-label={`Progression estimée ${Math.round(progress)} %`}><span style={{ width: `${progress}%` }} /></div>
      <main className="scene" key={scene.id}>
        <div className="scene-ornament" aria-hidden="true"><span /><i /></div>
        <p className="eyebrow">{scene.chapter}</p>
        <h1>{scene.title}</h1>
        <div className="scene-copy">{scene.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <p className="scene-atmosphere">{scene.atmosphere}</p>
        {scene.interaction && !completed && <div className={`screen-interaction screen-interaction--${scene.interaction.kind} ${interactionDone ? "is-complete" : ""}`}><span><MousePointer2 aria-hidden="true" /></span><div><small>Interaction du scénario</small><strong>{scene.interaction.label}</strong><p>{scene.interaction.hint}</p></div><button className="button button--quiet" type="button" onClick={() => setInteractionDone(true)}>{interactionDone ? "Signal reçu" : "Interagir"}</button></div>}
        {!completed && <div className="choices" aria-label="Que faites-vous ?">
          <p>Que faites-vous ?</p>
          {scene.choices.map((choice, index) => <button type="button" key={choice.id} disabled={Boolean(scene.interaction && !interactionDone)} onClick={() => choose(choice.nextSceneId)}><span className="choice-index">{String(index + 1).padStart(2, "0")}</span><span><small>{choice.tone}</small>{choice.label}</span><span className="choice-arrow" aria-hidden="true">→</span></button>)}
        </div>}
        {completed && <DemoSummary history={[...history, scene.id]} outcome={scene.outcome ?? "accord"} tree={tree} memory={memory} onRestart={restart} />}
      </main>
      {/* Une rupture ferme la situation : revenir en arrière la contredirait. */}
      <footer className="player-footer"><button type="button" className="text-button" onClick={goBack} disabled={history.length === 0 || scene.outcome === "rupture"}><ArrowLeft size={14} aria-hidden="true" /> Choix précédent</button><span>Démonstration hors ligne · Configuration de référence « Le Diapason »</span><button type="button" className="text-button" onClick={restart}><RotateCcw size={14} aria-hidden="true" /> Recommencer</button></footer>
    </div>
  );
}

const outcomeCopy: Record<DemoOutcome, { eyebrow: string; heading: string; note: string }> = {
  accord: {
    eyebrow: "Accord",
    heading: "Vous avez tenu la posture, et vous savez pourquoi.",
    note: "Le résultat est bon et le raisonnement est consolidé : ce que vous avez avancé était vérifiable par quelqu'un d'autre que vous.",
  },
  partielle: {
    eyebrow: "Fin partielle",
    heading: "Le résultat est là ; le raisonnement ne l'est pas.",
    note: "Vous avez eu raison sans rendre votre raison opposable. Une reprise sur le même chemin change l'issue à moindre coût.",
  },
  rupture: {
    eyebrow: "Rupture",
    heading: "La situation ne peut plus être rattrapée.",
    note: "Le moteur ne connaît pas d'échec : c'est la conséquence, dans le monde, qui ferme la porte. Il n'y a pas de reprise en cours de route — la scène se rejoue depuis le début.",
  },
};

/** Postures traversées, lues sur les chapitres du chemin réellement parcouru. */
function posturesOf(path: readonly { chapter: string }[]): string[] {
  return [...new Set(path.map((scene) => scene.chapter.split(" · ")[0]!).filter((posture) => ["Lucidité", "Discernement", "Arbitrage", "Courage", "Transmission", "Autonomie"].includes(posture)))];
}

function DemoSummary({ history, outcome, tree, memory, onRestart }: { history: string[]; outcome: DemoOutcome; tree: QuestTreeInput; memory: DemoQuestMemory; onRestart(): void }) {
  const path = history.map((id) => demoStory.scenes.find((scene) => scene.id === id)).filter((scene): scene is NonNullable<typeof scene> => Boolean(scene));
  const copy = outcomeCopy[outcome];
  const postures = posturesOf(path);
  const isRupture = outcome === "rupture";
  return <section className={`demo-summary demo-summary--${outcome}`} aria-label="Bilan de la démo">
    <div className="summary-heading">{isRupture ? <TriangleAlert aria-hidden="true" /> : <Sparkles aria-hidden="true" />}<div><p className="eyebrow">{copy.eyebrow}</p><h2>{copy.heading}</h2><p>{copy.note}</p></div></div>
    <div className="summary-grid">
      <article><Route aria-hidden="true" /><strong>{path.length} étapes traversées</strong><ol>{path.map((step) => <li key={step.id}>{step.title}</li>)}</ol></article>
      <article><Gift aria-hidden="true" /><strong>{isRupture ? "Ce que la situation a coûté" : "Ce que vous emportez"}</strong><ul>{postures.map((posture) => <li key={posture}>Posture exercée : {posture}</li>)}<li>{isRupture ? "Aucune fréquence : la démarche n'a pas été rendue explicite." : outcome === "accord" ? "Fréquence du doute : vous avez suspendu une conclusion trop fluide." : "Fréquence du doute, non consolidée : le fait manquait à l'intuition."}</li><li>Une page pour votre journal</li></ul></article>
    </div>
    <QuestGraphView tree={tree} masteryNodeIds={memory.nodeIds} masteryChoiceIds={memory.choiceIds} caption="Le récit complet de la démonstration : ce que vous venez de traverser et ce que vos essais précédents ont déjà révélé, mémorisé sur cet appareil." />
    <div className="summary-actions">
      {isRupture
        ? <><button className="button button--primary" type="button" onClick={onRestart}><RotateCcw aria-hidden="true" /> Reprendre depuis le début</button><Link className="button button--quiet" href={"/" as AppRoute}><DoorOpen aria-hidden="true" /> Créer mon aventure</Link></>
        : <><Link className="button button--primary" href={"/" as AppRoute}><DoorOpen aria-hidden="true" /> Créer mon aventure</Link><button className="button button--quiet" type="button" onClick={onRestart}><RotateCcw aria-hidden="true" /> Essayer une autre situation</button></>}
    </div>
  </section>;
}
