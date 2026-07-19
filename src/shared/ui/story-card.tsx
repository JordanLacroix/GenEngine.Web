import { ArrowUpRight, Clock3, Route as Route2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { StorySummary } from "@/entities/story/model/story";
import { formatDuration } from "@/shared/lib/format";

export function StoryCard({ story, priority = false }: { story: StorySummary; priority?: boolean }) {
  const href = (story.scenarioVersionId ? `/play/${story.scenarioVersionId}` : "/play/demo") as Route;
  return (
    <article className={`story-card story-card--${story.accent} ${priority ? "story-card--featured" : ""}`}>
      <div className="story-art" aria-hidden="true"><span className="story-orbit" /><span className="story-sigil">{story.title.slice(0, 1)}</span></div>
      <div className="story-card-body">
        <p className="eyebrow">{story.eyebrow}</p>
        <h3>{story.title}</h3>
        <p className="story-synopsis">{story.synopsis}</p>
        {story.progress !== undefined && <div className="progress-block"><div className="progress-meta"><span>Progression</span><span>{story.progress} %</span></div><div className="progress-track"><span style={{ width: `${story.progress}%` }} /></div></div>}
        <footer className="story-meta">
          <span>par {story.author}</span>
          <span><Clock3 size={14} aria-hidden="true" />{formatDuration(story.durationMinutes)}</span>
        </footer>
        {story.scenarioVersionId && <Link className="text-button" href={`/library/${story.scenarioVersionId}` as Route}><Route2 size={14} aria-hidden="true" /> Mémoire de mes parcours</Link>}
        <Link className="card-link" href={href}><span className="sr-only">Jouer à {story.title}</span><ArrowUpRight aria-hidden="true" /></Link>
      </div>
    </article>
  );
}
