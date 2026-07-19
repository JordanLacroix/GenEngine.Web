"use client";

import {
  AlertTriangle, BookOpenCheck, Eye, FileUp, GitBranch, Info, Plus, Rocket, Save, Search, Trash2,
  Trash, WandSparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  ExperienceDocumentContract, PagedScenariosContract, ProblemDetailsContract, ScenarioContract,
  ScenarioPreviewContract, ScenarioVersionContract, StructureReportContract, ValidationReportContract,
} from "@/shared/api/contracts";
import type { AssetPackManifest } from "@/shared/assets/asset-pack";
import { resolveAssetReference } from "@/shared/assets/asset-pack";
import { gameCopy } from "@/shared/lib/game-copy";
import {
  type DraftChoice, type DraftNode, draftMediaCoverage, isKnownAnimationCue, knownAnimationCues,
  narrativeDraft, type NarrativeDraft, serializeDraft, updateChoice, updateNode,
} from "../model/narrative-draft";
import { AssetField, AssetPreview, stopAssetPreview } from "./asset-field";

type Report =
  | { kind: "validation"; value: ValidationReportContract }
  | { kind: "analysis"; value: StructureReportContract }
  | { kind: "preview"; value: ScenarioPreviewContract }
  | { kind: "published"; value: ScenarioVersionContract };

/**
 * Scénarios : bibliothèque, graphe, inspecteur de scène et aperçu jouable.
 *
 * L'aperçu ne rejoue pas la logique du moteur — il montre ce que la
 * configuration ajoute à une scène : son visuel, son son et l'interaction
 * attachée à chaque choix. La validation, l'analyse, la prévisualisation
 * narrative et la publication restent des appels au moteur.
 */
export function ScenarioSection({ document, manifest, packAbsentReason }: {
  document?: ExperienceDocumentContract;
  manifest?: AssetPackManifest;
  packAbsentReason?: string;
}) {
  const [source, setSource] = useState("");
  const [scenario, setScenario] = useState<ScenarioContract>();
  const [scenarios, setScenarios] = useState<ScenarioContract[]>([]);
  const [query, setQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [report, setReport] = useState<Report>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [chosenCategoryId, setChosenCategoryId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [chosenProvider, setChosenProvider] = useState("");
  const [targetMinutes, setTargetMinutes] = useState("15");
  const [tone, setTone] = useState("immersive");

  // Catégorie et provider sont *dérivés* de la configuration tant que l'opérateur
  // n'a rien choisi : aucun effet ne recopie le document dans l'état local.
  const foundryEnabled = document?.aiProviders.some((item) => item.type === "AzureAiFoundry" && item.enabled) ?? false;
  const categoryId = chosenCategoryId || (document?.categories.find((category) => category.isVisible)?.id ?? "");
  const provider = chosenProvider || (foundryEnabled ? "azureAiFoundry" : "offline");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/scenarios?query=", { signal: controller.signal })
      .then((response) => read<PagedScenariosContract>(response))
      .then((page) => setScenarios(page.items))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(asMessage(reason)); });
    return () => controller.abort();
  }, []);

  const copy = (key: string, fallback: string) => gameCopy(document, key, fallback);
  const draft = narrativeDraft(source);
  const selectedNode = draft.nodes.find((node) => node.id === selectedNodeId);
  const coverage = draftMediaCoverage(draft);

  async function loadScenarios(value = query) {
    try {
      const page = await read<PagedScenariosContract>(await fetch(`/api/scenarios?query=${encodeURIComponent(value)}`));
      setScenarios(page.items);
    } catch (reason) { setError(asMessage(reason)); }
  }
  function openScenario(item: ScenarioContract) {
    const parsed = narrativeDraft(item.draftJson);
    setScenario(item);
    setSource(formatDraft(item.draftJson));
    setSelectedNodeId(parsed.initialNodeId || parsed.nodes[0]?.id || "");
    setReport(undefined);
  }
  function write(next: NarrativeDraft) { setSource(serializeDraft(next)); }
  async function run(operation: () => Promise<void>) {
    setBusy(true); setError(undefined);
    try { await operation(); } catch (reason) { setError(asMessage(reason)); } finally { setBusy(false); }
  }
  async function importScenario() {
    await run(async () => {
      const imported = await read<ScenarioContract>(await fetch("/api/scenarios", jsonRequest({ document: parse(source) })));
      openScenario(imported); await loadScenarios();
    });
  }
  async function saveDraft() {
    if (!scenario) return;
    setBusy(true); setError(undefined);
    try {
      const updated = await read<ScenarioContract>(await fetch(`/api/scenarios/${scenario.id}`, {
        ...jsonRequest({ expectedRevision: scenario.revision, document: parse(source) }), method: "PUT",
      }));
      openScenario(updated); await loadScenarios();
    } catch (reason) {
      // Un refus de schéma alors que le brouillon porte des champs média a une
      // cause probable et vérifiable : le moteur de cette instance ne connaît pas
      // encore ces champs. On le dit, au lieu de laisser « JSON invalide » seul.
      const carriesMedia = coverage.nodesWithVisual + coverage.choicesWithSound + coverage.choicesWithCue > 0;
      setError(carriesMedia
        ? `${asMessage(reason)} Ce brouillon porte des médias de scène ou de choix ; un moteur qui n’a pas encore le schéma média les refuse. Retirez-les pour enregistrer, ou déployez la version du moteur qui les accepte.`
        : asMessage(reason));
    } finally { setBusy(false); }
  }
  async function generate() {
    await run(async () => {
      const generated = await read<ScenarioContract>(await fetch("/api/studio/generate", jsonRequest({
        categoryId, prompt, provider, targetMinutes: Number(targetMinutes), tone,
      })));
      openScenario(generated); await loadScenarios();
    });
  }
  async function engineAction(kind: "validate" | "analyze" | "preview" | "publish") {
    if (!scenario) return;
    await run(async () => {
      const payload = kind === "preview"
        ? { action: kind, preview: { nodeId: selectedNodeId || draft.initialNodeId, turn: 0, variables: {}, characteristics: {}, inventory: [], evidence: [], relations: {}, rewards: [], visitedNodes: [] } }
        : { action: kind, expectedRevision: scenario.revision };
      const response = await fetch(`/api/scenarios/${scenario.id}`, jsonRequest(payload));
      if (kind === "validate") setReport({ kind: "validation", value: await read<ValidationReportContract>(response) });
      else if (kind === "analyze") setReport({ kind: "analysis", value: await read<StructureReportContract>(response) });
      else if (kind === "preview") setReport({ kind: "preview", value: await read<ScenarioPreviewContract>(response) });
      else setReport({ kind: "published", value: await read<ScenarioVersionContract>(response) });
    });
  }
  async function archive() {
    if (!scenario || !window.confirm(`Archiver ${scenario.title} ?`)) return;
    await run(async () => {
      const response = await fetch(`/api/scenarios/${scenario.id}?expectedRevision=${scenario.revision}`, { method: "DELETE" });
      if (!response.ok) await read<void>(response);
      setScenario(undefined); setSource(""); setSelectedNodeId(""); await loadScenarios();
    });
  }

  return (
    <div className="studio-panel">
      {error && <p className="studio-error" role="alert">{error}</p>}

      <section className="generation-canvas">
        <div className="generation-intro">
          <span><WandSparkles aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">{copy("studio.copilot.eyebrow", "Copilote narratif")}</p>
            <h2>{copy("studio.copilot.title", "Du monde global au premier brouillon")}</h2>
            <p>{copy("studio.copilot.subtitle", "Le moteur combine l’histoire globale, la catégorie et votre intention.")} <strong>{document?.game.name}</strong></p>
          </div>
        </div>
        <div className="generation-form">
          <label>{copy("studio.category.label", "Catégorie")}
            <select value={categoryId} onChange={(event) => setChosenCategoryId(event.target.value)}>
              {document?.categories.filter((category) => category.isVisible).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>{copy("studio.provider.label", "Provider")}
            <select value={provider} onChange={(event) => setChosenProvider(event.target.value)}>
              <option value="offline">Hors ligne déterministe</option>
              {foundryEnabled && <option value="azureAiFoundry">Azure AI Foundry</option>}
            </select>
          </label>
          <label>{copy("studio.duration.label", "Durée cible")}<input type="number" min="3" max="90" value={targetMinutes} onChange={(event) => setTargetMinutes(event.target.value)} /></label>
          <label>{copy("studio.tone.label", "Ton")}<input value={tone} onChange={(event) => setTone(event.target.value)} /></label>
          <label className="prompt-field">{copy("studio.prompt.label", "Votre intention")}
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Une enquête en plusieurs scènes, avec indices, dilemmes et trois fins distinctes…" />
          </label>
          <button type="button" className="button button--primary generation-submit" disabled={busy || prompt.trim().length < 20 || !categoryId} onClick={generate}>
            <WandSparkles aria-hidden="true" /> Générer le brouillon
          </button>
        </div>
      </section>

      <section className="studio-workspace" aria-label="Édition des scénarios">
        <aside className="studio-library">
          <div className="studio-library-heading">
            <div><p className="eyebrow">Vos scénarios</p><strong>{scenarios.length} brouillons</strong></div>
          </div>
          <label className="studio-search">
            <Search aria-hidden="true" /><span className="sr-only">Rechercher un scénario</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadScenarios(); }} placeholder="Titre ou intention…" />
          </label>
          {scenarios.map((item) => (
            <button key={item.id} type="button" className={scenario?.id === item.id ? "scenario-row is-active" : "scenario-row"} onClick={() => openScenario(item)}>
              <strong>{item.title}</strong>
              <small>r{item.revision} · {item.categoryId ? document?.categories.find((category) => category.id === item.categoryId)?.name ?? "Catégorie inconnue" : "Sans catégorie"}</small>
            </button>
          ))}
        </aside>

        <div className="story-graph-panel">
          <div className="studio-toolbar">
            <div>
              <p className="eyebrow">Arborescence narrative</p>
              <strong>{scenario ? `${scenario.title} · révision ${scenario.revision}` : draft.title || "Nouveau brouillon"}</strong>
            </div>
            <div>
              {scenario && <button type="button" className="button button--quiet" disabled={busy} onClick={saveDraft}><Save size={16} aria-hidden="true" /> Enregistrer</button>}
              <button type="button" className="button button--primary" disabled={busy || !source.trim()} onClick={importScenario}><FileUp size={16} aria-hidden="true" /> Importer une copie</button>
            </div>
          </div>
          {draft.nodes.length > 0 && (
            <p className="studio-coverage">
              {coverage.nodesWithVisual}/{coverage.nodes} scènes illustrées · {coverage.choicesWithSound}/{coverage.choices} choix sonorisés · {coverage.choicesWithCue}/{coverage.choices} choix animés
              {coverage.visualsWithoutDescription > 0 && <span className="studio-warning"> · {coverage.visualsWithoutDescription} visuel(s) sans description alternative</span>}
            </p>
          )}
          {draft.nodes.length
            ? <div className="story-graph">{draft.nodes.map((node, index) => (
              <button key={node.id} type="button" className={`graph-node ${selectedNodeId === node.id ? "is-selected" : ""} ${node.isEnding ? "is-ending" : ""}`} onClick={() => setSelectedNodeId(node.id)}>
                <span>{index + 1}</span>
                <div>
                  <small>{node.id}{node.id === draft.initialNodeId ? " · départ" : node.isEnding ? " · fin" : ""}{node.visualUrl ? " · illustrée" : ""}</small>
                  <strong>{node.text || "Scène sans texte"}</strong>
                  {node.choices.map((choice) => <em key={choice.id}>{choice.text} <b>→ {choice.targetNodeId}</b>{choice.animationCue ? ` · ${choice.animationCue}` : ""}</em>)}
                </div>
              </button>
            ))}</div>
            : <div className="graph-empty"><GitBranch aria-hidden="true" /><h3>Générez ou importez un scénario</h3><p>Les scènes, choix et destinations formeront ici une arborescence visuelle.</p></div>}
        </div>

        <aside className="node-inspector">
          <p className="eyebrow">Inspecteur de scène</p>
          {selectedNode
            ? <NodeInspector
              node={selectedNode} draft={draft} manifest={manifest} packAbsentReason={packAbsentReason}
              onNode={(patch) => write(updateNode(draft, selectedNode.id, patch))}
              onChoice={(index, patch) => write(updateChoice(draft, selectedNode.id, index, patch))}
            />
            : <p>Sélectionnez une scène.</p>}
          <details className="advanced-source">
            <summary>Source JSON avancée</summary>
            <textarea aria-label="Document de scénario JSON" spellCheck={false} value={source} onChange={(event) => setSource(event.target.value)} />
          </details>
          <div className="studio-engine-actions">
            <button type="button" disabled={!scenario || busy} onClick={() => engineAction("validate")}><BookOpenCheck aria-hidden="true" /> Valider</button>
            <button type="button" disabled={!scenario || busy} onClick={() => engineAction("analyze")}><GitBranch aria-hidden="true" /> Analyser</button>
            <button type="button" disabled={!scenario || busy} onClick={() => engineAction("preview")}><Eye aria-hidden="true" /> Prévisualiser</button>
            <button type="button" className="publish-action" disabled={!scenario || busy} onClick={() => engineAction("publish")}><Rocket aria-hidden="true" /> Publier</button>
            {scenario && <button type="button" className="danger-action" onClick={archive}><Trash aria-hidden="true" /> Archiver</button>}
          </div>
        </aside>
      </section>

      {selectedNode && <ScenePreview node={selectedNode} manifest={manifest} />}
      {report && <ReportView report={report} />}
    </div>
  );
}

function NodeInspector({ node, draft, manifest, packAbsentReason, onNode, onChoice }: {
  node: DraftNode;
  draft: NarrativeDraft;
  manifest?: AssetPackManifest;
  packAbsentReason?: string;
  onNode: (patch: Partial<DraftNode>) => void;
  onChoice: (index: number, patch: Partial<DraftChoice>) => void;
}) {
  return (
    <>
      <label>ID de scène<input value={node.id} disabled /></label>
      <label>Texte de la scène<textarea value={node.text} onChange={(event) => onNode({ text: event.target.value })} /></label>
      <label className="check-line">
        <input type="checkbox" checked={Boolean(node.isEnding)} onChange={(event) => onNode({ isEnding: event.target.checked })} /> Fin de l’histoire
      </label>

      <h3>Média de la scène</h3>
      <p className="asset-notice"><Info aria-hidden="true" />
        Ces champs sont écrits dans le document narratif. Un moteur qui n’a pas encore le schéma
        média refuse l’enregistrement avec « JSON invalide » : vérifiez la version déployée avant
        d’illustrer tout un scénario.
      </p>
      <AssetField
        id={`node-${node.id}-visual`} kind="image" manifest={manifest} packAbsentReason={packAbsentReason}
        label="Visuel" value={node.visualUrl ?? ""} onChange={(next) => onNode({ visualUrl: next })}
      />
      <label>Description du visuel
        <textarea
          value={node.visualDescription ?? ""} placeholder="Ce que montre l’image, pour qui ne la voit pas."
          onChange={(event) => onNode({ visualDescription: event.target.value })}
        />
      </label>
      {node.visualUrl && !node.visualDescription && (
        <p className="asset-notice is-warning"><AlertTriangle aria-hidden="true" />Un visuel sans description n’est pas lisible par tout le monde.</p>
      )}
      <AssetField
        id={`node-${node.id}-sound`} kind="audio" manifest={manifest} packAbsentReason={packAbsentReason}
        label="Son de la scène" value={node.soundUrl ?? ""} onChange={(next) => onNode({ soundUrl: next })}
      />

      <h3>Choix et interactions</h3>
      {node.choices.map((choice, index) => (
        <div className="choice-editor" key={choice.id}>
          <input aria-label="Libellé du choix" value={choice.text} onChange={(event) => onChoice(index, { text: event.target.value })} />
          <label className="sr-only" htmlFor={`choice-${node.id}-${index}-target`}>Destination</label>
          <select id={`choice-${node.id}-${index}-target`} value={choice.targetNodeId} onChange={(event) => onChoice(index, { targetNodeId: event.target.value })}>
            {draft.nodes.map((target) => <option key={target.id} value={target.id}>{target.id}</option>)}
          </select>
          <button type="button" aria-label={`Supprimer le choix ${choice.text}`} onClick={() => onNode({ choices: node.choices.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 aria-hidden="true" /></button>
          <AssetField
            id={`choice-${node.id}-${index}-sound`} kind="audio" manifest={manifest} packAbsentReason={packAbsentReason}
            label="Son du choix" value={choice.soundUrl ?? ""} onChange={(next) => onChoice(index, { soundUrl: next })}
          />
          <label className="cue-select" htmlFor={`choice-${node.id}-${index}-cue`}>
            <span>Repère d’animation</span>
            <select id={`choice-${node.id}-${index}-cue`} value={isKnownAnimationCue(choice.animationCue) ? choice.animationCue : choice.animationCue ? "__custom" : ""} onChange={(event) => onChoice(index, { animationCue: event.target.value === "__custom" ? choice.animationCue ?? "" : event.target.value })}>
              <option value="">Aucun</option>
              {knownAnimationCues.map((cue) => <option key={cue.id} value={cue.id}>{cue.label}</option>)}
              {choice.animationCue && !isKnownAnimationCue(choice.animationCue) && <option value="__custom">{choice.animationCue} (inconnu du client)</option>}
            </select>
          </label>
          {choice.animationCue && !isKnownAnimationCue(choice.animationCue) && (
            <p className="asset-notice"><Info aria-hidden="true" />Ce repère est transmis au moteur, mais le client ne sait pas l’animer : l’aperçu ne montrera rien.</p>
          )}
          {isKnownAnimationCue(choice.animationCue) && (
            <p className="asset-hint">{knownAnimationCues.find((cue) => cue.id === choice.animationCue)?.description}</p>
          )}
        </div>
      ))}
      <button type="button" className="button button--quiet" onClick={() => onNode({ choices: [...node.choices, { id: `choice-${node.choices.length + 1}`, text: "Nouveau choix", targetNodeId: draft.nodes.find((item) => item.id !== node.id)?.id ?? node.id, condition: null, effects: [] }] })}>
        <Plus aria-hidden="true" /> Ajouter un choix
      </button>
    </>
  );
}

/**
 * Aperçu de la scène telle qu'elle sera perçue : le visuel, le texte, puis
 * l'interaction réelle attachée à chaque choix. Le repère d'animation est joué
 * *et* nommé — l'information n'est jamais portée par la seule animation, et la
 * feuille de style neutralise le mouvement sous `prefers-reduced-motion`.
 */
function ScenePreview({ node, manifest }: { node: DraftNode; manifest?: AssetPackManifest }) {
  const [played, setPlayed] = useState<{ index: number; cue?: string; label: string } | undefined>();
  const [tick, setTick] = useState(0);
  const visual = node.visualUrl ? resolveAssetReference(node.visualUrl, manifest) : undefined;

  function trigger(choice: DraftChoice, index: number) {
    setTick((value) => value + 1);
    setPlayed({ index, cue: isKnownAnimationCue(choice.animationCue) ? choice.animationCue : undefined, label: describeInteraction(choice) });
    if (!choice.soundUrl) return;
    const resolved = resolveAssetReference(choice.soundUrl, manifest);
    if (!resolved || resolved.kind !== "audio") return;
    stopAssetPreview();
    const audio = new Audio(resolved.url);
    audio.volume = 0.46;
    void audio.play().catch(() => undefined);
  }

  return (
    <section className="scene-preview" aria-label="Aperçu de la scène configurée">
      <header><Eye aria-hidden="true" /><h3>Aperçu — {node.id}</h3></header>
      <div className="scene-preview-stage">
        {visual?.kind === "image"
          ? <img src={visual.url} alt={node.visualDescription ?? ""} />
          : <p className="scene-preview-placeholder">{node.visualUrl ? "Visuel non résolu : pack absent ou asset inconnu." : "Aucun visuel assigné à cette scène."}</p>}
        <blockquote>{node.text || "Scène sans texte."}</blockquote>
        {node.soundUrl && <SceneSound url={node.soundUrl} manifest={manifest} nodeId={node.id} />}
        <div className="scene-preview-choices">
          {node.choices.length === 0 && <p className="studio-note">Cette scène n’offre aucun choix.</p>}
          {node.choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              className={played?.index === index && played.cue ? `preview-choice cue-${played.cue}` : "preview-choice"}
              // Le remontage force le rejeu de l'animation à chaque déclenchement.
              data-run={played?.index === index ? tick : undefined}
              onClick={() => trigger(choice, index)}
            >
              {choice.text || "Choix sans libellé"}
            </button>
          ))}
        </div>
        {played && <p className="scene-preview-feedback" role="status">{played.label}</p>}
      </div>
    </section>
  );
}

function SceneSound({ url, manifest, nodeId }: { url: string; manifest?: AssetPackManifest; nodeId: string }) {
  const resolved = resolveAssetReference(url, manifest);
  if (!resolved || resolved.kind !== "audio") return <p className="studio-note">Son de scène non résolu : pack absent ou asset inconnu.</p>;
  return <AssetPreview id={`scene-${nodeId}-sound`} url={resolved.url} kind="audio" compact />;
}

/** Décrit en clair l'interaction jouée : l'aperçu reste lisible sans son ni animation. */
function describeInteraction(choice: DraftChoice): string {
  const parts: string[] = [];
  parts.push(`Choix « ${choice.text || "sans libellé"} » → ${choice.targetNodeId || "aucune destination"}`);
  parts.push(choice.soundUrl ? "son joué" : "aucun son");
  if (!choice.animationCue) parts.push("aucune animation");
  else if (isKnownAnimationCue(choice.animationCue)) parts.push(`animation « ${knownAnimationCues.find((cue) => cue.id === choice.animationCue)?.label} »`);
  else parts.push(`repère « ${choice.animationCue} » inconnu du client, non joué`);
  return `${parts[0]} · ${parts.slice(1).join(" · ")}`;
}

function ReportView({ report }: { report: Report }) {
  if (report.kind === "validation") {
    return (
      <section className="studio-report">
        <h2><BookOpenCheck aria-hidden="true" /> Validation {report.value.isValid ? "réussie" : "à corriger"}</h2>
        {report.value.issues.length === 0
          ? <p>Aucun problème détecté.</p>
          : <ul>{report.value.issues.map((issue, index) => <li key={`${issue.path}-${issue.code}-${index}`}><strong>{issue.code}</strong> · {issue.path}<br />{issue.message}</li>)}</ul>}
      </section>
    );
  }
  if (report.kind === "analysis") {
    return (
      <section className="studio-report">
        <h2><GitBranch aria-hidden="true" /> Analyse structurelle</h2>
        <div className="report-metrics">
          <span><b>{report.value.loops.length}</b> boucles</span>
          <span><b>{report.value.conditionalDeadEnds.length}</b> impasses</span>
          <span><b>{report.value.unreachableEndingNodeIds.length}</b> fins inatteignables</span>
          <span><b>{report.value.nodesWithoutEndingPath.length}</b> scènes sans fin</span>
        </div>
      </section>
    );
  }
  if (report.kind === "preview") {
    return (
      <section className="studio-report preview-report">
        <h2><Eye aria-hidden="true" /> Prévisualisation moteur</h2>
        <blockquote>{report.value.currentStep.text}</blockquote>
        {report.value.currentStep.choices.map((choice) => <span key={choice.id}>{choice.text}</span>)}
      </section>
    );
  }
  return (
    <section className="studio-report">
      <h2><Rocket aria-hidden="true" /> Version {report.value.number} publiée</h2>
      <small>Hash immuable : {report.value.snapshotHash}</small>
    </section>
  );
}

function jsonRequest(body: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
function parse(value: string): Record<string, unknown> {
  try { return JSON.parse(value) as Record<string, unknown>; } catch { throw new Error("Le JSON n’est pas valide."); }
}
function formatDraft(value: string) {
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}
function asMessage(error: unknown) { return error instanceof Error ? error.message : "Erreur inattendue"; }
async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined;
    throw new Error(problem?.detail ?? problem?.title ?? `Le service a répondu ${response.status}.`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
