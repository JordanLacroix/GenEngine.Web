"use client";

import { BookOpenCheck, CircleCheck, Eye, FileUp, GitBranch, Rocket, Save } from "lucide-react";
import { useState } from "react";
import type { ProblemDetailsContract, ScenarioContract, ScenarioPreviewContract, ScenarioVersionContract, StructureReportContract, ValidationReportContract } from "@/shared/api/contracts";

type Report = { kind: "validation"; value: ValidationReportContract } | { kind: "analysis"; value: StructureReportContract } | { kind: "preview"; value: ScenarioPreviewContract } | { kind: "published"; value: ScenarioVersionContract };

export function StudioWorkbench() {
  const [source, setSource] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [scenario, setScenario] = useState<ScenarioContract>();
  const [nodeId, setNodeId] = useState("");
  const [turn, setTurn] = useState("0");
  const [world, setWorld] = useState('{\n  "variables": {},\n  "characteristics": {},\n  "inventory": [],\n  "evidence": [],\n  "relations": {},\n  "rewards": [],\n  "visitedNodes": []\n}');
  const [report, setReport] = useState<Report>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function importScenario() {
    await run(async () => {
      const document = parse(source);
      const imported = await read<ScenarioContract>(await fetch("/api/scenarios", jsonRequest({ document })));
      setScenario(imported); setSource(formatDraft(imported.draftJson));
      setNodeId(typeof document.initialNodeId === "string" ? document.initialNodeId : ""); setReport(undefined);
    });
  }

  async function authenticate() {
    await run(async () => {
      await read<{ expiresAt: string }>(await fetch("/api/auth", jsonRequest({ mode: "login", userName, password })));
      setPassword(""); setAuthenticated(true);
    });
  }

  async function updateDraft() {
    if (!scenario) return;
    await run(async () => {
      setScenario(await read<ScenarioContract>(await fetch(`/api/scenarios/${scenario.id}`, { ...jsonRequest({ expectedRevision: scenario.revision, document: parse(source) }), method: "PUT" })));
      setReport(undefined);
    });
  }

  async function action(kind: "validate" | "analyze" | "preview" | "publish") {
    if (!scenario) return;
    await run(async () => {
      const payload = kind === "preview" ? { action: kind, preview: { nodeId, turn: Number(turn), ...parse(world) } } : { action: kind, expectedRevision: scenario.revision };
      const response = await fetch(`/api/scenarios/${scenario.id}`, jsonRequest(payload));
      if (kind === "validate") setReport({ kind: "validation", value: await read<ValidationReportContract>(response) });
      else if (kind === "analyze") setReport({ kind: "analysis", value: await read<StructureReportContract>(response) });
      else if (kind === "preview") setReport({ kind, value: await read<ScenarioPreviewContract>(response) });
      else setReport({ kind: "published", value: await read<ScenarioVersionContract>(response) });
    });
  }

  async function run(operation: () => Promise<void>) { setBusy(true); setError(undefined); try { await operation(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Erreur inattendue"); } finally { setBusy(false); } }

  return <>
    {error && <p className="studio-error" role="alert">{error}</p>}
    <details className="studio-auth"><summary>{authenticated ? "Compte auteur connecté" : "Connecter un compte auteur"}</summary><div><label>Identifiant<input autoComplete="username" value={userName} onChange={(event) => setUserName(event.target.value)} /></label><label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button--quiet" type="button" disabled={busy || !userName || !password} onClick={authenticate}>Se connecter</button></div></details>
    <section className="connected-studio" aria-label="Atelier de scénario">
      <div className="studio-editor"><div className="studio-toolbar"><div><p className="eyebrow">Document Narrative JSON</p><strong>{scenario ? `${scenario.title} · révision ${scenario.revision}` : "Nouveau brouillon"}</strong></div><div>{scenario && <button type="button" className="button button--quiet" disabled={busy} onClick={updateDraft}><Save size={16} /> Enregistrer</button>}<button type="button" className="button button--primary" disabled={busy || !source.trim()} onClick={importScenario}><FileUp size={16} /> {scenario ? "Importer une copie" : "Importer"}</button></div></div><textarea aria-label="Document de scénario JSON" spellCheck={false} value={source} onChange={(event) => setSource(event.target.value)} placeholder={'{\n  "schemaVersion": 2,\n  "title": "Mon histoire",\n  "initialNodeId": "opening",\n  "nodes": []\n}'} /></div>
      <aside className="studio-actions"><p className="eyebrow">Capacités moteur</p><button type="button" disabled={!scenario || busy} onClick={() => action("validate")}><BookOpenCheck /> Valider le graphe</button><button type="button" disabled={!scenario || busy} onClick={() => action("analyze")}><GitBranch /> Analyser la structure</button><fieldset disabled={!scenario || busy}><legend>Prévisualisation injectée</legend><label>Nœud<input value={nodeId} onChange={(event) => setNodeId(event.target.value)} /></label><label>Tour<input inputMode="numeric" value={turn} onChange={(event) => setTurn(event.target.value)} /></label><label>État joueur JSON<textarea value={world} onChange={(event) => setWorld(event.target.value)} /></label><button type="button" onClick={() => action("preview")}><Eye /> Prévisualiser</button></fieldset><button type="button" className="publish-action" disabled={!scenario || busy} onClick={() => action("publish")}><Rocket /> Publier la révision</button></aside>
    </section>
    {report && <ReportView report={report} />}
  </>;
}

function ReportView({ report }: { report: Report }) {
  if (report.kind === "validation") return <section className="studio-report"><h2><CircleCheck /> Validation {report.value.isValid ? "réussie" : "à corriger"}</h2>{report.value.issues.length === 0 ? <p>Aucun problème détecté.</p> : <ul>{report.value.issues.map((issue, index) => <li key={`${issue.path}-${issue.code}-${index}`}><strong>{issue.code}</strong> · {issue.path}<br />{issue.message}</li>)}</ul>}</section>;
  if (report.kind === "analysis") return <section className="studio-report"><h2><GitBranch /> Analyse structurelle</h2><div className="report-metrics"><span><b>{report.value.loops.length}</b> boucles</span><span><b>{report.value.conditionalDeadEnds.length}</b> impasses conditionnelles</span><span><b>{report.value.unreachableEndingNodeIds.length}</b> fins inatteignables</span><span><b>{report.value.nodesWithoutEndingPath.length}</b> scènes sans chemin final</span></div>{report.value.conditionalDeadEnds.map((risk) => <p key={risk.nodeId}><strong>{risk.nodeId}</strong> — {risk.explanation}</p>)}</section>;
  if (report.kind === "preview") return <section className="studio-report preview-report"><h2><Eye /> Prévisualisation</h2><p className="eyebrow">{report.value.currentStep.kind} · tour {report.value.currentStep.turn}</p><blockquote>{report.value.currentStep.text}</blockquote>{report.value.currentStep.choices.map((choice) => <span key={choice.id}>{choice.text}</span>)}</section>;
  return <section className="studio-report"><h2><Rocket /> Version {report.value.number} publiée</h2><p><code>{report.value.id}</code></p><small>Hash immuable : {report.value.snapshotHash}</small></section>;
}

function jsonRequest(body: unknown): RequestInit { return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }; }
function parse(value: string): Record<string, unknown> { try { return JSON.parse(value) as Record<string, unknown>; } catch { throw new Error("Le JSON n’est pas valide."); } }
function formatDraft(value: string) { try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } }
async function read<T>(response: Response): Promise<T> { if (!response.ok) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; throw new Error(problem?.detail ?? problem?.title ?? `Le service a répondu ${response.status}.`); } return response.json() as Promise<T>; }
