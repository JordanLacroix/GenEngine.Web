"use client";

import {
  ArrowDown, ArrowRight, BookOpen, Check, Compass, Layers, LineChart, PlayCircle, ShieldCheck, SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useAmbience } from "@/shared/audio/audio-provider";
import {
  diapasonActs, platformPillars, referencePostures, schoolOutcomes,
} from "@/features/home/model/home-content";

const pillarIcons: Record<string, typeof Layers> = {
  postures: Layers,
  configuration: SlidersHorizontal,
  progression: LineChart,
};

/**
 * Accueil à deux niveaux.
 *
 * L'ouverture montre l'univers de la configuration de référence, parce que c'est
 * lui qui donne envie de regarder. La promesse plateforme vient immédiatement
 * après, parce que c'est elle qui emporte la décision. L'émotion vend la visite,
 * la plateforme vend la décision.
 *
 * `authenticated` ne masque que la démonstration : elle s'adresse aux personnes
 * qui ne se sont pas encore connectées.
 */
export function HomeExperience({ authenticated }: { authenticated: boolean }) {
  useAmbience("ambience.home");
  return <div className="home">
    <section className="home-overture" aria-labelledby="overture-title">
      <div className="home-overture-art" aria-hidden="true" />
      <div className="home-overture-copy">
        <p className="eyebrow eyebrow--accent">Configuration de référence · Le Diapason</p>
        <h1 id="overture-title">En 2026, tout répond avant que vous ayez douté.</h1>
        <p className="home-lead">
          Les systèmes génératifs sont partout. Des gouvernements en interdisent certains ; d’autres nient
          que certaines personnes existent. Et l’on perd, doucement, l’habitude de prendre du recul.
          Vous êtes étudiante ou étudiant en école d’ingénieurs, en alternance. Un collectif vous confie
          un diapason pour réaccorder votre jugement.
        </p>
        <div className="home-actions">
          {authenticated
            ? <Link className="button button--primary" href={"/experience" as Route}>
                Reprendre mon univers <ArrowRight size={18} aria-hidden="true" />
              </Link>
            : <Link className="button button--primary" href={"/play/demo" as Route}>
                <PlayCircle size={18} aria-hidden="true" /> Entrer dans Le Diapason
              </Link>}
          <a className="button button--quiet" href="#plateforme">
            Voir la plateforme <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <ol className="home-acts">
          {diapasonActs.map((act) => <li key={act.id}>
            <span>{act.step}</span>
            <strong>{act.title}</strong>
            <p>{act.body}</p>
          </li>)}
        </ol>
      </div>
    </section>

    <section className="home-turn" id="plateforme" aria-labelledby="turn-title">
      <p className="eyebrow">Ce que vous déployez</p>
      <h2 id="turn-title">
        Ce que vous achetez n’est pas une histoire.<br />
        <em>C’est le moteur qui les fabrique.</em>
      </h2>
      <p className="home-lead">
        « Le Diapason » est une configuration de démonstration parmi d’autres. GenEngine est le moteur
        narratif qui l’exécute et l’interface complète qui la paramètre — pour une école d’ingénieurs,
        une entreprise ou un organisme de formation professionnelle.
      </p>
    </section>

    <section className="home-postures" aria-labelledby="postures-title">
      <div className="home-section-heading">
        <p className="eyebrow eyebrow--accent"><Compass size={15} aria-hidden="true" /> Catégories par posture</p>
        <h2 id="postures-title">On ne range pas les parcours par sujet.<br />On les range par geste.</h2>
      </div>
      <ul className="posture-grid">
        {referencePostures.map((posture, index) => <li key={posture.id}>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <strong>{posture.name}</strong>
          <p>{posture.description}</p>
        </li>)}
      </ul>
      <p className="home-note">
        Cette liste est la proposition par défaut. Chaque organisation redéfinit ses catégories,
        ses parcours et leurs prérequis depuis l’interface de configuration.
      </p>
    </section>

    <section className="home-pillars" aria-labelledby="pillars-title">
      <h2 className="sr-only" id="pillars-title">Les capacités de la plateforme</h2>
      {platformPillars.map((pillar) => {
        const Icon = pillarIcons[pillar.id] ?? Layers;
        return <article key={pillar.id}>
          <div className="pillar-mark" aria-hidden="true"><Icon /></div>
          <div>
            <p className="eyebrow">{pillar.eyebrow}</p>
            <h3>{pillar.title}</h3>
            <p className="pillar-body">{pillar.body}</p>
            <ul>
              {pillar.points.map((point) => <li key={point}>
                <Check size={15} aria-hidden="true" />{point}
              </li>)}
            </ul>
          </div>
        </article>;
      })}
    </section>

    <section className="home-school" aria-labelledby="school-title">
      <div className="home-section-heading">
        <p className="eyebrow eyebrow--accent"><ShieldCheck size={15} aria-hidden="true" /> Pour une école</p>
        <h2 id="school-title">Ce que vous obtenez, et ce que vous pouvez montrer.</h2>
      </div>
      <div className="school-grid">
        {schoolOutcomes.map((outcome) => <article key={outcome.id}>
          <h3>{outcome.title}</h3>
          <p>{outcome.body}</p>
        </article>)}
      </div>
      <p className="home-note">
        GenEngine ne revendique aucun gain chiffré : les effets d’un dispositif pédagogique se mesurent
        chez vous, sur vos promotions. La plateforme fournit les traces qui rendent cette mesure possible.
      </p>
    </section>

    <section className="home-close" aria-labelledby="close-title">
      <h2 id="close-title">
        {authenticated ? "Votre univers vous attend." : "Commencez par la vivre."}
      </h2>
      <p>
        {authenticated
          ? "Reprenez votre carte, votre familier et votre journal là où vous les avez laissés."
          : "Quinze minutes suffisent pour comprendre ce que le moteur sait faire. Aucun compte n’est demandé."}
      </p>
      <div className="home-actions">
        {authenticated
          ? <Link className="button button--primary" href={"/experience" as Route}>
              Reprendre mon univers <ArrowRight size={18} aria-hidden="true" />
            </Link>
          : <Link className="button button--primary" href={"/play/demo" as Route}>
              <PlayCircle size={18} aria-hidden="true" /> Vivre la démonstration
            </Link>}
        <Link className="button button--quiet" href={"/library" as Route}>
          <BookOpen size={16} aria-hidden="true" /> Parcourir la bibliothèque
        </Link>
      </div>
    </section>
  </div>;
}
