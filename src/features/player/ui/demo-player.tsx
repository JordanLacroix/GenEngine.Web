"use client";

import { ArrowLeft, Bookmark, RotateCcw, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { demoStory } from "@/shared/mocks/stories";

export function DemoPlayer() {
  const [sceneId, setSceneId] = useState(demoStory.openingSceneId);
  const [history, setHistory] = useState<string[]>([]);
  const [sound, setSound] = useState(false);
  const scene = useMemo(() => demoStory.scenes.find((candidate) => candidate.id === sceneId) ?? demoStory.scenes[0]!, [sceneId]);
  const progress = scene.chapter.startsWith("Épilogue") ? 100 : Math.min(92, ((history.length + 1) / 7) * 100);

  function choose(nextSceneId: string) {
    setHistory((current) => [...current, scene.id]);
    setSceneId(nextSceneId);
  }

  function goBack() {
    const previous = history.at(-1);
    if (!previous) return;
    setSceneId(previous);
    setHistory((current) => current.slice(0, -1));
  }

  function restart() { setHistory([]); setSceneId(demoStory.openingSceneId); }

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
        <div className="choices" aria-label="Que faites-vous ?">
          <p>Que faites-vous ?</p>
          {scene.choices.map((choice, index) => <button type="button" key={choice.id} onClick={() => choose(choice.nextSceneId)}><span className="choice-index">{String(index + 1).padStart(2, "0")}</span><span><small>{choice.tone}</small>{choice.label}</span><span className="choice-arrow" aria-hidden="true">→</span></button>)}
        </div>
      </main>
      <footer className="player-footer"><button type="button" className="text-button" onClick={goBack} disabled={history.length === 0}><ArrowLeft size={14} aria-hidden="true" /> Choix précédent</button><span>Progression enregistrée localement · Démo visuelle</span><button type="button" className="text-button" onClick={restart}><RotateCcw size={14} aria-hidden="true" /> Recommencer</button></footer>
    </div>
  );
}
