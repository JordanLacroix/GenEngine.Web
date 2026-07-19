"use client";

import { ArrowLeft, Bookmark, DoorOpen, Gift, MousePointer2, RotateCcw, Route, Sparkles, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { demoStory } from "@/shared/mocks/stories";
import { demoQuestTree, readDemoQuestMemory, rememberDemoQuestSteps, type DemoQuestMemory } from "@/features/player/model/demo-quest-tree";
import type { QuestTreeInput } from "@/features/player/model/quest-graph";
import { QuestGraphView } from "@/features/player/ui/quest-graph-view";

export function DemoPlayer() {
  const [sceneId, setSceneId] = useState(demoStory.openingSceneId);
  const [history, setHistory] = useState<string[]>([]);
  const [sound, setSound] = useState(false);
  const [interactionDone, setInteractionDone] = useState(false);
  const [choiceHistory, setChoiceHistory] = useState<string[]>([]);
  const [memory, setMemory] = useState<DemoQuestMemory>({ nodeIds: [], choiceIds: [] });
  const scene = useMemo(() => demoStory.scenes.find((candidate) => candidate.id === sceneId) ?? demoStory.scenes[0]!, [sceneId]);
  const progress = scene.chapter.startsWith("Épilogue") ? 100 : Math.min(92, ((history.length + 1) / 7) * 100);

  const completed = scene.choices.length === 0;
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
    if (next && next.choices.length === 0) setMemory(rememberDemoQuestSteps(readDemoQuestMemory(), [...path, nextSceneId], choices));
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
        <Link href="/" className="icon-button"><ArrowLeft aria-hidden="true" /><span className="sr-only">Quitter le récit</span></Link>
        <div className="player-title"><span>{demoStory.eyebrow}</span><strong>{demoStory.title}</strong></div>
        <div className="player-tools"><button type="button" className="icon-button" onClick={() => setSound((value) => !value)}>{sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}<span className="sr-only">{sound ? "Couper l'ambiance" : "Activer l'ambiance"}</span></button><button type="button" className="icon-button"><Bookmark aria-hidden="true" /><span className="sr-only">Ajouter aux favoris</span></button></div>
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
        {completed && <DemoSummary history={[...history, scene.id]} ending={scene.id} tree={tree} memory={memory} onRestart={restart} />}
      </main>
      <footer className="player-footer"><button type="button" className="text-button" onClick={goBack} disabled={history.length === 0}><ArrowLeft size={14} aria-hidden="true" /> Choix précédent</button><span>Progression enregistrée localement · Démo visuelle</span><button type="button" className="text-button" onClick={restart}><RotateCcw size={14} aria-hidden="true" /> Recommencer</button></footer>
    </div>
  );
}

function DemoSummary({ history, ending, tree, memory, onRestart }: { history: string[]; ending: string; tree: QuestTreeInput; memory: DemoQuestMemory; onRestart(): void }) {
  const path = history.map((id) => demoStory.scenes.find((scene) => scene.id === id)).filter(Boolean);
  return <section className="demo-summary" aria-label="Bilan de la démo"><div className="summary-heading"><Sparkles aria-hidden="true" /><div><p className="eyebrow">Chemin accompli</p><h2>{ending === "dawn" ? "Vous avez rendu la mémoire à la cité." : "Vous êtes devenu gardien du récit."}</h2></div></div><div className="summary-grid"><article><Route aria-hidden="true" /><strong>{path.length} étapes traversées</strong><ol>{path.map((step) => <li key={step!.id}>{step!.title}</li>)}</ol></article><article><Gift aria-hidden="true" /><strong>Souvenirs gagnés</strong><ul><li>Le sceau du Dernier Phare</li><li>Une page pour votre journal</li><li>La confiance de Lueur</li></ul></article></div><QuestGraphView tree={tree} masteryNodeIds={memory.nodeIds} masteryChoiceIds={memory.choiceIds} caption="Le récit complet de la démonstration : ce que vous venez de traverser et ce que vos essais précédents ont déjà révélé, mémorisé sur cet appareil." /><div className="summary-actions"><Link className="button button--primary" href="/account"><DoorOpen aria-hidden="true" /> Créer mon aventure</Link><button className="button button--quiet" type="button" onClick={onRestart}><RotateCcw aria-hidden="true" /> Explorer un autre chemin</button></div></section>;
}
