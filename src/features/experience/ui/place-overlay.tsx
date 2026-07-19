"use client";

import { ArrowRight, CalendarClock, DoorOpen, History, Search, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { searchScenarios, type Place } from "@/features/experience/model/map-places";

/**
 * Interface d'un lieu de la carte.
 *
 * Franchir une porte ouvre réellement quelque chose : la liste des scénarios
 * disponibles à cet endroit, leur durée, leur état d'avancement et ce que
 * l'organisation en attend. Un lieu sans contenu le dit explicitement au lieu de
 * laisser croire à une panne.
 */
export function PlaceOverlay({
  place, unclassified, onClose,
}: { place: Place; unclassified: boolean; onClose(): void }) {
  const [query, setQuery] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = `place-${place.id}-title`;

  useEffect(() => { closeButton.current?.focus(); }, [place.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const scenarios = searchScenarios(place.scenarios, query);

  return <div className="place-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="place-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel}>
      <button className="game-overlay-close" type="button" ref={closeButton} onClick={onClose} aria-label="Fermer ce lieu et revenir à la carte">
        <X aria-hidden="true" />
      </button>
      <header>
        <p className="eyebrow eyebrow--accent"><DoorOpen size={15} aria-hidden="true" /> Passage ouvert</p>
        <h2 id={titleId}>{place.name}</h2>
        <p className="place-description">{place.description}</p>
        <p className="place-count">
          {place.scenarios.length === 0
            ? "Aucun récit publié ici pour le moment."
            : `${place.scenarios.length} récit${place.scenarios.length > 1 ? "s" : ""} · découverte moyenne ${place.progressPercent} %`}
        </p>
      </header>

      {unclassified && <p className="place-notice" role="note">
        Les récits publiés ne sont pas encore rattachés à une catégorie dans la configuration.
        Chaque porte donne donc sur l’ensemble du catalogue.
      </p>}

      {place.scenarios.length > 2 && <label className="universe-search place-search">
        <Search aria-hidden="true" />
        <span className="sr-only">Rechercher un récit dans ce lieu</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un récit…" />
      </label>}

      {place.isEmpty
        ? <div className="place-empty">
            <p>Ce lieu existe dans la configuration, mais aucun scénario publié ne lui est rattaché.</p>
            <p>Une personne administratrice peut y rattacher des récits depuis l’interface de configuration.</p>
          </div>
        : <ul className="place-list">
            {scenarios.map(({ story, masteryPercent, required, dueAt }) => <li key={story.id}>
              <div className="place-list-head">
                <p className="eyebrow">{story.durationMinutes} min{required ? " · requis" : ""}</p>
                <h3>{story.title}</h3>
              </div>
              <p className="place-synopsis">{story.synopsis}</p>
              {dueAt && <p className="place-due">
                <CalendarClock size={14} aria-hidden="true" /> À rendre avant le {new Date(dueAt).toLocaleDateString("fr-FR")}
              </p>}
              <div className="place-progress">
                <div className="progress-track"><span style={{ width: `${masteryPercent ?? 0}%` }} /></div>
                <small>{masteryPercent === undefined ? "Jamais parcouru" : `${masteryPercent} % découvert`}</small>
              </div>
              <div className="place-actions">
                <Link className="button button--primary" href={`/play/${story.scenarioVersionId}` as Route}>
                  {masteryPercent === undefined ? "Franchir la porte" : "Reprendre ce chemin"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link className="text-button" href={`/library/${story.scenarioVersionId}` as Route}>
                  <History size={14} aria-hidden="true" /> Mémoire de mes parcours
                </Link>
              </div>
            </li>)}
            {scenarios.length === 0 && <li className="place-empty"><p>Aucun récit ne correspond à cette recherche.</p></li>}
          </ul>}
    </div>
  </div>;
}
