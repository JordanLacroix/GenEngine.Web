import { ArrowUpRight, Clock3 } from "lucide-react";
import Link from "next/link";
import type { StorySummary } from "@/entities/story/model/story";
import { formatDuration } from "@/shared/lib/format";

export function StoryCard({ story, priority = false }: { story: StorySummary; priority?: boolean }) {
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
        <Link className="card-link" href="/play/demo"><span className="sr-only">Jouer à {story.title}</span><ArrowUpRight aria-hidden="true" /></Link>
      </div>
    </article>
  );
}
