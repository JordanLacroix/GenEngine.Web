"use client";

import { ArrowLeft, BookOpen, GitBranch, LogIn, MousePointer2, Pause, Play, RotateCcw, Route, Send, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CurrentStepContract, NarrativeTreeContract, ProblemDetailsContract, SessionContract, SessionStateContract } from "@/shared/api/contracts";

interface ConnectedPlayerProps { scenarioVersionId: string }
type CommandKind = "choice" | "continue" | "answer" | "text" | "confirm" | "pause" | "resume";

export function ConnectedPlayer({ scenarioVersionId }: ConnectedPlayerProps) {
  const [state, setState] = useState<SessionStateContract>();
  const [title, setTitle] = useState("Histoire GenEngine");
  const [needsAuthentication, setNeedsAuthentication] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [seed, setSeed] = useState("42");
  const [text, setText] = useState("");
  const [showsTree, setShowsTree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const storageKey = `genengine.session.${scenarioVersionId}`;

  const loadSession = useCallback(async (id: string) => {
    const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (response.status === 401) { setNeedsAuthentication(true); return; }
    if (!response.ok) throw await responseError(response);
    setState(await response.json() as SessionStateContract);
    setNeedsAuthentication(false);
  }, []);

  useEffect(() => {
    fetch("/api/catalog").then(async (response) => response.ok ? response.json() as Promise<Array<{ id: string; title: string }>> : [])
      .then((stories) => setTitle(stories.find((story) => story.id === scenarioVersionId)?.title ?? "Histoire GenEngine"))
      .catch(() => undefined);
    const saved = window.localStorage.getItem(storageKey);
    async function restore() {
      if (saved) {
        try { await loadSession(saved); } catch (reason) { setError(message(reason)); }
      } else { setNeedsAuthentication(true); }
    }
    void restore();
  }, [loadSession, scenarioVersionId, storageKey]);

  async function authenticate(mode: "login" | "register") {
    await run(async () => {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, userName, password }) });
      if (!response.ok) throw await responseError(response);
      setPassword("");
      setNeedsAuthentication(false);
      const saved = window.localStorage.getItem(storageKey);
      if (saved) await loadSession(saved);
    });
  }

  async function startSession() {
    await run(async () => {
      const response = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioVersionId, seed }) });
      if (response.status === 401) { setNeedsAuthentication(true); throw new Error("Connectez-vous avant de commencer."); }
      if (!response.ok) throw await responseError(response);
      const session = await response.json() as SessionContract;
      window.localStorage.setItem(storageKey, session.id);
      await loadSession(session.id);
    });
  }

  async function command(kind: CommandKind, value?: string | boolean) {
    if (!state) return;
    await run(async () => {
      const response = await fetch(`/api/sessions/${encodeURIComponent(state.session.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, commandId: kind === "pause" || kind === "resume" ? undefined : crypto.randomUUID(), expectedRevision: state.session.revision, value }),
      });
      if (!response.ok) throw await responseError(response);
      await loadSession(state.session.id);
      if (kind === "confirm") setText("");
    });
  }

  async function restart() {
    window.localStorage.removeItem(storageKey);
    setState(undefined);
    await startSession();
  }

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(undefined);
    try { await action(); } catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  return (
    <div className="player-shell connected-player">
      <header className="player-header">
        <Link href="/library" className="icon-button"><ArrowLeft aria-hidden="true" /><span className="sr-only">Quitter le récit</span></Link>
        <div className="player-title"><span>Session moteur</span><strong>{title}</strong></div>
        <div className="player-tools">
          {state && <button type="button" className="icon-button" onClick={() => setShowsTree((current) => !current)}><GitBranch aria-hidden="true" /><span className="sr-only">Afficher l&apos;arbre narratif</span></button>}
          {state && active(state.session.status) && <button type="button" className="icon-button" disabled={busy} onClick={() => command(state.session.status === "Paused" ? "resume" : "pause")}>
            {state.session.status === "Paused" ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}<span className="sr-only">{state.session.status === "Paused" ? "Reprendre" : "Mettre en pause"}</span>
          </button>}
        </div>
      </header>
      <div className="player-progress" aria-label={state ? `Tour ${state.session.turn + 1}` : "Session non démarrée"}><span style={{ width: state ? `${Math.min(100, (state.session.turn + 1) * 8)}%` : "0%" }} /></div>
      {error && <p className="player-error" role="alert">{error}</p>}
      {needsAuthentication ? <AuthenticationPanel userName={userName} password={password} seed={seed} busy={busy} onUserName={setUserName} onPassword={setPassword} onSeed={setSeed} onAuthenticate={authenticate} onStart={startSession} />
        : state ? <SessionScene state={state} text={text} busy={busy} onText={setText} onCommand={command} />
          : <main className="scene player-entry"><BookOpen aria-hidden="true" /><p className="eyebrow">Prêt à entrer</p><h1>{title}</h1><label>Graine déterministe<input value={seed} inputMode="numeric" onChange={(event) => setSeed(event.target.value)} /></label><button className="button button--primary" type="button" disabled={busy} onClick={startSession}>Commencer</button></main>}
      {showsTree && state && <TreePanel tree={state.tree} onClose={() => setShowsTree(false)} />}
      <footer className="player-footer"><span>{state ? `${statusLabel(state.session.status)} · Révision ${state.session.revision}` : "Connexion directe au moteur"}</span>{state && <button className="text-button" type="button" disabled={busy} onClick={restart}><RotateCcw size={14} aria-hidden="true" /> Nouvelle partie</button>}</footer>
    </div>
  );
}

function AuthenticationPanel(props: { userName: string; password: string; seed: string; busy: boolean; onUserName(value: string): void; onPassword(value: string): void; onSeed(value: string): void; onAuthenticate(mode: "login" | "register"): void; onStart(): void }) {
  return <main className="scene auth-panel"><LogIn size={36} aria-hidden="true" /><p className="eyebrow">Compte GenEngine</p><h1>Retrouvez vos chemins.</h1><p className="scene-copy">Le moteur associe chaque session à votre identité. Le jeton reste proté dans un cookie inaccessible au navigateur.</p><div className="auth-fields"><label>Identifiant<input autoComplete="username" value={props.userName} onChange={(event) => props.onUserName(event.target.value)} /></label><label>Mot de passe<input type="password" autoComplete="current-password" value={props.password} onChange={(event) => props.onPassword(event.target.value)} /></label><label>Graine déterministe<input inputMode="numeric" value={props.seed} onChange={(event) => props.onSeed(event.target.value)} /></label><div><button className="button button--primary" type="button" disabled={props.busy || !props.userName || !props.password} onClick={() => props.onAuthenticate("login")}>Se connecter</button><button className="button button--quiet" type="button" disabled={props.busy || !props.userName || !props.password} onClick={() => props.onAuthenticate("register")}>Créer un compte</button></div></div><button type="button" className="text-button" disabled={props.busy} onClick={props.onStart}>J&apos;ai déjà une session authentifiée</button></main>;
}

function SessionScene({ state, text, busy, onText, onCommand }: { state: SessionStateContract; text: string; busy: boolean; onText(value: string): void; onCommand(kind: CommandKind, value?: string | boolean): void }) {
  const step = state.currentStep;
  return <main className="scene" key={`${step.nodeId}-${step.interactionId ?? "legacy"}-${state.session.revision}`}><div className="scene-ornament" aria-hidden="true"><span /><i /></div><p className="eyebrow">Tour {step.turn + 1} · {kindLabel(step.kind)}</p><h1>{step.kind === "Completed" ? "Épilogue" : step.nodeId}</h1><div className="scene-copy"><p>{step.text}</p></div>{step.kind !== "Completed" && <EngineInteractionMaterial step={step} />}<Interaction step={step} busy={busy} text={text} onText={onText} onCommand={onCommand} />{step.kind === "Completed" && <EngineSummary state={state} />}</main>;
}

function EngineInteractionMaterial({ step }: { step: CurrentStepContract }) {
  const labels = step.kind === "Quiz" ? ["Indice visible", "Réponse à matérialiser"] : step.kind === "FreeText" ? ["Expression libre", "Le moteur interprète votre intention"] : step.kind === "CharacteristicGate" ? ["Passage conditionnel", "Vos choix précédents ouvrent ce dialogue"] : ["Interaction narrative", "Cette action fait avancer le scénario"];
  return <aside className="screen-interaction screen-interaction--engine"><span><MousePointer2 aria-hidden="true" /></span><div><small>{labels[0]}</small><strong>{labels[1]}</strong><p>Interaction {step.interactionId ?? step.nodeId} fournie par le scénario publié.</p></div></aside>;
}

function EngineSummary({ state }: { state: SessionStateContract }) {
  const visited = state.tree.nodes.filter((node) => node.state === "Visited" || node.state === "Current");
  return <section className="engine-summary"><div><Trophy aria-hidden="true" /><p className="eyebrow">Bilan enregistré</p><h2>Votre chemin rejoint le journal.</h2></div><p><Route aria-hidden="true" /> {visited.length} étapes parcourues · {state.session.turn + 1} tours joués</p><div>{visited.map((node) => <span key={node.id}>{node.id}</span>)}</div><Link className="button button--primary" href="/experience">Voir ma carte et mes gains</Link></section>;
}

function Interaction({ step, busy, text, onText, onCommand }: { step: CurrentStepContract; busy: boolean; text: string; onText(value: string): void; onCommand(kind: CommandKind, value?: string | boolean): void }) {
  if (step.status === "Paused") return <div className="interaction-panel"><p>Cette histoire est en pause.</p><button className="button button--primary" type="button" onClick={() => onCommand("resume")}>Reprendre</button></div>;
  if (step.status === "Completed" || step.status === "Abandoned") return null;
  if (step.kind === "Narration") return <button className="button button--primary scene-action" type="button" disabled={busy} onClick={() => onCommand("continue")}>Continuer <Send size={16} aria-hidden="true" /></button>;
  if (step.kind === "FreeText" && step.status === "AwaitingExternalInput") return <div className="free-text"><label htmlFor="player-text">Votre réponse</label><textarea id="player-text" rows={5} value={text} onChange={(event) => onText(event.target.value)} /><button className="button button--primary" type="button" disabled={busy || !text.trim()} onClick={() => onCommand("text", text)}>Analyser ma réponse</button></div>;
  if (step.kind === "FreeText" && step.status === "AwaitingValidation" && step.pendingTextAnalysis) return <div className="analysis-card"><p className="eyebrow">{step.pendingTextAnalysis.isAccepted ? "Réponse reconnue" : "Réponse partielle"}</p><strong>{step.pendingTextAnalysis.explanation}</strong>{step.pendingTextAnalysis.matchedTerms.length > 0 && <small>Termes reconnus : {step.pendingTextAnalysis.matchedTerms.join(", ")}</small>}<div><button className="button button--quiet" type="button" disabled={busy} onClick={() => onCommand("confirm", false)}>Modifier</button><button className="button button--primary" type="button" disabled={busy} onClick={() => onCommand("confirm", true)}>Confirmer</button></div></div>;
  return <div className="choices" aria-label={step.kind === "Quiz" ? "Choisissez une réponse" : "Que faites-vous ?"}><p>{step.kind === "Quiz" ? "Votre réponse" : "Que faites-vous ?"}</p>{step.choices.map((choice, index) => <button type="button" disabled={busy} key={choice.id} onClick={() => onCommand(step.kind === "Quiz" ? "answer" : "choice", choice.id)}><span className="choice-index">{String(index + 1).padStart(2, "0")}</span><span>{choice.text}</span><span className="choice-arrow" aria-hidden="true">→</span></button>)}</div>;
}

function TreePanel({ tree, onClose }: { tree: NarrativeTreeContract; onClose(): void }) {
  return <aside className="tree-panel" aria-label="Arbre narratif"><div className="tree-heading"><div><p className="eyebrow">Exploration explicable</p><h2>Arbre de session</h2></div><button className="icon-button" onClick={onClose} type="button"><ArrowLeft aria-hidden="true" /><span className="sr-only">Fermer l&apos;arbre</span></button></div><div className="tree-nodes">{tree.nodes.map((node) => <article key={node.id} className={`tree-node tree-node--${node.state.toLowerCase()}`}><span>{node.state}</span><strong>{node.id}</strong><p>{node.text}</p></article>)}</div><div className="tree-edges">{tree.edges.map((edge) => <details key={`${edge.sourceNodeId}-${edge.inputId}-${edge.targetNodeId}`}><summary>{edge.isAvailable ? "Ouvert" : "Verrouillé"} · {edge.text}</summary><p>{edge.sourceNodeId} → {edge.targetNodeId}</p><small>{edge.evaluation.explanation}</small></details>)}</div></aside>;
}

function active(status: SessionContract["status"]) { return ["AwaitingInput", "AwaitingExternalInput", "AwaitingValidation", "Paused"].includes(status); }
function statusLabel(status: SessionContract["status"]) { return ({ AwaitingInput: "En cours", Paused: "En pause", Completed: "Terminé", Abandoned: "Abandonné", AwaitingExternalInput: "Saisie attendue", AwaitingValidation: "Validation attendue" })[status]; }
function kindLabel(kind: CurrentStepContract["kind"]) { return ({ LegacyChoice: "Choix", Narration: "Narration", ChoiceSet: "Choix", Quiz: "Question", CharacteristicGate: "Trait", FreeText: "Expression libre", Completed: "Fin" })[kind]; }
async function responseError(response: Response) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; return new Error(problem?.detail ?? problem?.title ?? `Le service a répondu ${response.status}.`); }
function message(reason: unknown) { return reason instanceof Error ? reason.message : "Une erreur inattendue est survenue."; }
