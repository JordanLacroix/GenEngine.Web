"use client";

import { ArrowRight, SkipForward, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublishedExperienceContract } from "@/shared/api/contracts";

export function StoryIntro({ experience }: { experience?: PublishedExperienceContract }) {
  const [scene, setScene] = useState(0);
  const [visible, setVisible] = useState(false);
  const intro = experience?.document.intro;
  const storageKey = `genengine.intro.${experience?.version ?? 0}`;
  useEffect(() => {
    if (!intro?.enabled) return;
    const alreadySeen = intro.displayPolicy !== "EveryLaunch" && window.localStorage.getItem(storageKey) === "seen";
    const timer = window.setTimeout(() => setVisible(!alreadySeen), 0);
    return () => window.clearTimeout(timer);
  }, [intro?.displayPolicy, intro?.enabled, storageKey]);
  if (!visible || !intro) return null;
  const ordered = [...intro.scenes].sort((left, right) => left.order - right.order);
  const current = ordered[scene];
  if (!current) return null;
  function finish() { window.localStorage.setItem(storageKey, "seen"); setVisible(false); }
  function next() { if (scene === ordered.length - 1) finish(); else setScene((value) => value + 1); }
  return <div className="story-intro" role="dialog" aria-modal="true" aria-label="Introduction du jeu" style={current.imageUrl ? { backgroundImage: `linear-gradient(90deg, rgb(5 9 11 / 94%), rgb(5 9 11 / 35%)), url(${current.imageUrl})` } : undefined}><div className="story-intro-copy"><p className="eyebrow eyebrow--accent"><Sparkles />{current.eyebrow}</p><h1>{current.title}</h1><p>{current.body}</p><div><button className="button button--primary" onClick={next}>{scene === ordered.length - 1 ? "Entrer dans le monde" : "Continuer"}<ArrowRight /></button>{intro.allowSkip && <button className="button button--quiet" onClick={finish}><SkipForward />Passer</button>}</div><small>{scene + 1} / {ordered.length}</small></div></div>;
}
