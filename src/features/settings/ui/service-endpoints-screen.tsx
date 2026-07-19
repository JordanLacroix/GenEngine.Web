"use client";

import {
  CircleCheck, CircleX, LoaderCircle, Network, RotateCcw, Save, Server, ShieldAlert, Sliders,
} from "lucide-react";
import { useState } from "react";
import {
  defaultGroupedEndpoints, type EndpointConfigurationContract, type EndpointMode,
  type EndpointOverride, type EndpointProbeResult, type GroupedEndpoints, type ServiceId,
  serviceDescriptors, type UnitEndpoints,
} from "@/shared/api/service-endpoints";
import { useFeedback } from "@/shared/ui/feedback-provider";

type ProbeState = Record<string, EndpointProbeResult | "running">;

/**
 * Configuration des URLs de services.
 *
 * Ce que cet écran enregistre a un effet réel : la valeur part dans un cookie
 * `HttpOnly` posé par `/api/settings/endpoints`, et la façade serveur la relit
 * à chaque appel. Elle ne vaut que pour ce navigateur ; l'environnement du
 * serveur reste le défaut de l'instance.
 *
 * Lorsque l'exploitant a désactivé la surcharge, l'écran reste consultable et
 * le dit — il n'enregistre pas une valeur sans effet.
 */
export function ServiceEndpointsScreen({ initial }: { initial: EndpointConfigurationContract }) {
  const feedback = useFeedback();
  const [state, setState] = useState(initial);
  const [mode, setMode] = useState<EndpointMode>(initial.override?.mode ?? "grouped");
  const [grouped, setGrouped] = useState<GroupedEndpoints>(
    initial.override?.mode === "grouped" ? initial.override : defaultGroupedEndpoints,
  );
  const [unit, setUnit] = useState<UnitEndpoints>(
    initial.override?.mode === "unit" ? initial.override : { mode: "unit", urls: initial.environment },
  );
  const [probes, setProbes] = useState<ProbeState>({});
  const [busy, setBusy] = useState(false);

  const draft: EndpointOverride = mode === "grouped" ? grouped : unit;
  const editable = state.overrideEnabled;

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/settings/endpoints", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error(await detailOf(response));
      setState(await refresh());
      feedback.succeed("Adresses enregistrées. Les appels au moteur partent désormais vers cette configuration.");
    } catch (error) { feedback.fail(asMessage(error)); }
    finally { setBusy(false); }
  }

  async function restore() {
    const confirmed = await feedback.confirm({
      title: "Revenir à la configuration du serveur ?",
      body: "Les adresses saisies dans ce navigateur seront oubliées et les variables d’environnement du serveur redeviendront la seule source.",
      confirmLabel: "Revenir au serveur",
      destructive: true,
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      const response = await fetch("/api/settings/endpoints", { method: "DELETE" });
      if (!response.ok) throw new Error(await detailOf(response));
      const next = await refresh();
      setState(next);
      setMode("grouped");
      setGrouped(defaultGroupedEndpoints);
      setUnit({ mode: "unit", urls: next.environment });
      setProbes({});
      feedback.succeed("Configuration locale effacée.");
    } catch (error) { feedback.fail(asMessage(error)); }
    finally { setBusy(false); }
  }

  async function test(service: ServiceId) {
    setProbes((current) => ({ ...current, [service]: "running" }));
    try {
      const response = await fetch("/api/settings/endpoints/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, override: editable ? draft : undefined }),
      });
      if (!response.ok) throw new Error(await detailOf(response));
      const result = await response.json() as EndpointProbeResult;
      setProbes((current) => ({ ...current, [service]: result }));
    } catch (error) {
      setProbes((current) => {
        const next = { ...current };
        delete next[service];
        return next;
      });
      feedback.fail(asMessage(error));
    }
  }

  async function testAll() {
    for (const descriptor of serviceDescriptors) await test(descriptor.id);
  }

  return <div className="page-shell settings-page">
    <header className="settings-head">
      <div>
        <p className="eyebrow eyebrow--accent"><Sliders size={15} aria-hidden="true" /> Paramètres de connexion</p>
        <h1>Où vit votre moteur ?</h1>
        <p>
          GenEngine Web n’est qu’un client : il appelle six services. Indiquez-les ici si votre
          déploiement ne suit pas la convention locale. La résolution reste faite par le serveur —
          le navigateur ne parle jamais directement au moteur.
        </p>
      </div>
      <p className={state.source === "override" ? "settings-source is-local" : "settings-source"}>
        <Server size={14} aria-hidden="true" />
        {state.source === "override"
          ? "Configuration de ce navigateur"
          : "Configuration du serveur (variables d’environnement)"}
      </p>
    </header>

    {!editable && <p className="settings-locked" role="note">
      <ShieldAlert size={16} aria-hidden="true" />
      <span>
        L’exploitant a désactivé la surcharge des adresses sur cette instance
        (<code>GENENGINE_ALLOW_ENDPOINT_OVERRIDE</code>). Les adresses ci-dessous sont celles que le
        serveur utilise ; elles restent testables, mais aucune saisie ne sera enregistrée.
      </span>
    </p>}

    {editable && !state.allowedHosts.includes("*") && <p className="settings-locked" role="note">
      <ShieldAlert size={16} aria-hidden="true" />
      <span>
        Le serveur n’accepte de relayer que vers&nbsp;
        {state.allowedHosts.map((host) => <code key={host}>{host} </code>)}
        — une adresse hors de cette liste sera refusée. L’exploitant élargit la liste avec
        <code> GENENGINE_ENDPOINT_ALLOWED_HOSTS</code>.
      </span>
    </p>}

    <fieldset className="settings-mode" disabled={!editable}>
      <legend>Topologie du déploiement</legend>
      <label>
        <input type="radio" name="endpoint-mode" checked={mode === "grouped"} onChange={() => setMode("grouped")} />
        <span>
          <strong>Groupée</strong>
          <small>Un hôte commun, un port par service. C’est le cas d’un moteur déployé d’un seul tenant.</small>
        </span>
      </label>
      <label>
        <input type="radio" name="endpoint-mode" checked={mode === "unit"} onChange={() => setMode("unit")} />
        <span>
          <strong>Unitaire</strong>
          <small>Une URL complète et indépendante par service, pour un déploiement réparti sur plusieurs machines.</small>
        </span>
      </label>
    </fieldset>

    {mode === "grouped" && <fieldset className="settings-common" disabled={!editable}>
      <legend>Hôte commun</legend>
      <label>
        <span>Schéma</span>
        <select value={grouped.scheme} onChange={(event) => setGrouped({ ...grouped, scheme: event.target.value === "https" ? "https" : "http" })}>
          <option value="http">http</option>
          <option value="https">https</option>
        </select>
      </label>
      <label>
        <span>Hôte ou adresse</span>
        <input
          value={grouped.host}
          onChange={(event) => setGrouped({ ...grouped, host: event.target.value })}
          placeholder="localhost"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
    </fieldset>}

    <div className="settings-services">
      {serviceDescriptors.map((descriptor) => {
        const probe = probes[descriptor.id];
        const url = mode === "grouped"
          ? `${grouped.scheme}://${grouped.host || "…"}:${grouped.ports[descriptor.id]}`
          : unit.urls[descriptor.id];
        return <article key={descriptor.id}>
          <header>
            <Network size={16} aria-hidden="true" />
            <div>
              <strong>{descriptor.label}</strong>
              <small>{descriptor.responsibility}</small>
            </div>
          </header>
          {mode === "grouped"
            ? <label>
                <span>Port</span>
                <input
                  type="number" min={1} max={65535} inputMode="numeric" disabled={!editable}
                  value={grouped.ports[descriptor.id]}
                  onChange={(event) => setGrouped({
                    ...grouped,
                    ports: { ...grouped.ports, [descriptor.id]: Number(event.target.value) },
                  })}
                />
              </label>
            : <label>
                <span>URL complète</span>
                <input
                  value={unit.urls[descriptor.id]} disabled={!editable} autoComplete="off" spellCheck={false}
                  placeholder={`http://localhost:${descriptor.defaultPort}`}
                  onChange={(event) => setUnit({
                    ...unit,
                    urls: { ...unit.urls, [descriptor.id]: event.target.value },
                  })}
                />
              </label>}
          <p className="settings-resolved"><code>{url}</code></p>
          <div className="settings-probe">
            <button type="button" className="button button--quiet" disabled={probe === "running"} onClick={() => void test(descriptor.id)}>
              {probe === "running" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Network size={15} aria-hidden="true" />}
              Tester
            </button>
            {probe && probe !== "running" && <p
              className={probe.reachable ? "probe-result is-reachable" : "probe-result is-unreachable"}
              role="status"
            >
              {probe.reachable ? <CircleCheck size={15} aria-hidden="true" /> : <CircleX size={15} aria-hidden="true" />}
              <span>{probe.detail} <small>({probe.latencyMs} ms)</small></span>
            </p>}
          </div>
          <p className="settings-env">
            Variable serveur : <code>{descriptor.envVariable}</code> · défaut <code>{descriptor.defaultPort}</code>
          </p>
        </article>;
      })}
    </div>

    <div className="settings-actions">
      <button type="button" className="button button--primary" disabled={!editable || busy} onClick={() => void save()}>
        <Save size={16} aria-hidden="true" /> Enregistrer pour ce navigateur
      </button>
      <button type="button" className="button button--quiet" disabled={busy} onClick={() => void testAll()}>
        <Network size={16} aria-hidden="true" /> Tout tester
      </button>
      <button type="button" className="button button--quiet" disabled={busy || state.source !== "override"} onClick={() => void restore()}>
        <RotateCcw size={16} aria-hidden="true" /> Revenir à la configuration du serveur
      </button>
    </div>

    <details className="settings-explainer">
      <summary>Comment cette configuration agit-elle réellement ?</summary>
      <p>
        Les appels au moteur partent du serveur Next.js, pas du navigateur : c’est lui qui porte le
        jeton de session. Le serveur n’accepte donc de viser que les hôtes déclarés par l’exploitant :
        sans cette liste, cet écran ferait de lui un relais vers tout ce qu’il peut joindre. Enregistrer ici pose un cookie <code>HttpOnly</code>, <code>SameSite=Strict</code>,
        que la façade serveur relit à chaque requête pour choisir l’adresse à appeler. Le navigateur ne
        lit jamais ce cookie et aucune URL de service n’est intégrée au bundle.
      </p>
      <p>
        La portée est donc <strong>ce navigateur uniquement</strong> : la configuration ne change rien pour les
        autres personnes connectées à la même instance. Pour changer l’instance elle-même, ce sont les
        variables d’environnement du serveur qui font foi.
      </p>
      <p>
        Un test réussi prouve qu’un serveur HTTP répond à cette adresse, pas qu’il s’agit du bon service :
        une réponse <code>404</code> est signalée comme joignable, avec la réserve écrite.
      </p>
    </details>
  </div>;
}

async function refresh(): Promise<EndpointConfigurationContract> {
  const response = await fetch("/api/settings/endpoints", { cache: "no-store" });
  if (!response.ok) throw new Error("État de configuration illisible.");
  return response.json() as Promise<EndpointConfigurationContract>;
}

async function detailOf(response: Response): Promise<string> {
  const problem = await response.json().catch(() => undefined) as { detail?: string } | undefined;
  return problem?.detail ?? `Le service a répondu ${response.status}.`;
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
}
