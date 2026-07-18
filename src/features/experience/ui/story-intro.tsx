"use client";

import { ArrowRight, SkipForward, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublishedExperienceContract } from "@/shared/api/contracts";

const fallbackIntro = {
  enabled: true,
  displayPolicy: "OncePerVersion" as const,
  allowSkip: true,
  minimumDisplaySeconds: 0,
  scenes: [
    { id: "threshold", eyebrow: "Avant le premier choix", title: "Chaque monde commence par une porte.", body: "Derrière elle, rien n’est écrit à votre place. Vos décisions dessinent la route, les rencontres et les souvenirs.", imageUrl: "/illustrations/intro-gateway.jpg", order: 1 },
    { id: "companion", eyebrow: "Une présence à vos côtés", title: "Créez le familier qui apprendra votre manière d’avancer.", body: "Il peut éclairer un détail, reformuler une énigme ou se taire. Il conseille ; il ne choisit jamais pour vous.", imageUrl: "/illustrations/familiar-aster.jpg", order: 2 },
    { id: "key", eyebrow: "Le prologue", title: "Votre première histoire vous remettra une clé.", body: "Terminez le tutoriel, relisez le chemin parcouru, puis ouvrez la porte de l’aventure qui vous attire vraiment.", imageUrl: "/illustrations/tutorial-key.jpg", order: 3 },
  ],
};

export function StoryIntro({ experience }: { experience?: PublishedExperienceContract }) {
  const [scene, setScene] = useState(0);
  const [visible, setVisible] = useState(false);
  const intro = experience ? experience.document.intro : fallbackIntro;
  const storageKey = `genengine.intro.${experience?.version ?? 0}`;
  useEffect(() => {
    if (!intro?.enabled) return;
    if (new URLSearchParams(window.location.search).get("intro") === "1") {
      const replayTimer = window.setTimeout(() => { setVisible(true); setScene(0); }, 0);
      return () => window.clearTimeout(replayTimer);
    }
    const alreadySeen = intro.displayPolicy !== "EveryLaunch" && window.localStorage.getItem(storageKey) === "seen";
    const timer = window.setTimeout(() => setVisible(!alreadySeen), 0);
    return () => window.clearTimeout(timer);
  }, [intro?.displayPolicy, intro?.enabled, storageKey]);
  if (!visible || !intro) return null;
  const ordered = [...intro.scenes].sort((left, right) => left.order - right.order);
  const current = ordered[scene];
  if (!current) return null;
  function finish() {
    window.localStorage.setItem(storageKey, "seen");
    if (new URLSearchParams(window.location.search).get("intro") === "1") window.location.assign("/account");
    else setVisible(false);
  }
  function next() { if (scene === ordered.length - 1) finish(); else setScene((value) => value + 1); }
  return <div className="story-intro" role="dialog" aria-modal="true" aria-label="Introduction du jeu" style={current.imageUrl ? { backgroundImage: `linear-gradient(90deg, rgb(5 9 11 / 96%), rgb(5 9 11 / 24%)), url(${current.imageUrl})` } : undefined}><div className="story-intro-copy"><p className="eyebrow eyebrow--accent"><Sparkles />{current.eyebrow}</p><h1>{current.title}</h1><p>{current.body}</p><div><button className="button button--primary" onClick={next}>{scene === ordered.length - 1 ? "Aller à la connexion" : "Continuer"}<ArrowRight /></button>{intro.allowSkip && <button className="button button--quiet" onClick={finish}><SkipForward />Passer</button>}</div><small>{scene + 1} / {ordered.length}</small></div></div>;
}
