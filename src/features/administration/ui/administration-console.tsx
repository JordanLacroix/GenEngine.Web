"use client";

import { Bot, Building2, Check, Coins, KeyRound, LoaderCircle, Plus, Save, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminConfigurationContract, ExperienceDocumentContract, PermissionContract, ProblemDetailsContract, RoleContract } from "@/shared/api/contracts";

type Tab = "game" | "access" | "ai" | "auth" | "economy";
const tabs: Array<{ id: Tab; label: string; icon: typeof Sparkles }> = [
  { id: "game", label: "Jeu & structure", icon: Sparkles },
  { id: "access", label: "Accès & rôles", icon: ShieldCheck },
  { id: "ai", label: "IA & familier", icon: Bot },
  { id: "auth", label: "Authentification", icon: KeyRound },
  { id: "economy", label: "Économie", icon: Coins },
];

export function AdministrationConsole() {
  const [tab, setTab] = useState<Tab>("game");
  const [configuration, setConfiguration] = useState<AdminConfigurationContract>();
  const [roles, setRoles] = useState<RoleContract[]>([]);
  const [permissions, setPermissions] = useState<PermissionContract[]>([]);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [assignmentRoleId, setAssignmentRoleId] = useState("");
  const [assignmentScope, setAssignmentScope] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string>();

  async function load() {
    setBusy(true);
    try {
      const [configResponse, accessResponse] = await Promise.all([fetch("/api/admin/configuration"), fetch("/api/admin/access")]);
      setConfiguration(await read<AdminConfigurationContract>(configResponse));
      const access = await read<{ roles: RoleContract[]; permissions: PermissionContract[] }>(accessResponse);
      setRoles(access.roles); setPermissions(access.permissions);
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/admin/configuration", { signal: controller.signal }),
      fetch("/api/admin/access", { signal: controller.signal }),
    ]).then(async ([configResponse, accessResponse]) => {
      setConfiguration(await read<AdminConfigurationContract>(configResponse));
      const access = await read<{ roles: RoleContract[]; permissions: PermissionContract[] }>(accessResponse);
      setRoles(access.roles); setPermissions(access.permissions);
    }).catch((error: unknown) => setMessage(asMessage(error))).finally(() => setBusy(false));
    return () => controller.abort();
  }, []);
  async function save(publish = false) {
    if (!configuration) return;
    setBusy(true); setMessage(undefined);
    try {
      const saved = await read<AdminConfigurationContract>(await fetch("/api/admin/configuration", {
        method: publish ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publish ? { expectedRevision: configuration.revision } : { expectedRevision: configuration.revision, document: configuration.document }),
      }));
      setConfiguration(saved); setMessage(publish ? "Configuration publiée pour les clients." : "Brouillon de configuration enregistré.");
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }
  async function createRole() {
    setBusy(true); setMessage(undefined);
    try {
      const role = await read<RoleContract>(await fetch("/api/admin/access", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName, description: roleDescription, permissions: rolePermissions }),
      }));
      setRoles((value) => [...value, role]); setRoleName(""); setRoleDescription(""); setRolePermissions([]); setMessage("Rôle personnalisé créé.");
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }
  async function assignRole() {
    setBusy(true); setMessage(undefined);
    try {
      const response = await fetch("/api/admin/access/assign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: assignmentUserId, roleId: assignmentRoleId, scope: assignmentScope || undefined }),
      });
      if (!response.ok) await read<void>(response);
      setAssignmentUserId(""); setAssignmentScope(""); setMessage("Rôle affecté à l’utilisateur.");
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }
  function update(mutator: (current: AdminConfigurationContract) => AdminConfigurationContract) {
    setConfiguration((current) => current ? mutator(current) : current);
  }

  if (!configuration) return <section className="admin-loading">{busy && <LoaderCircle className="spin" />}<p>{message ?? "Chargement du centre de contrôle…"}</p><button className="button button--quiet" onClick={load}>Réessayer</button></section>;
  const document = configuration.document;
  const foundry = document.aiProviders.find((provider) => provider.type === "AzureAiFoundry");
  const familiar = document.familiars[0];

  return <section className="admin-console">
    <aside className="admin-sidebar">
      <div className="admin-status"><span className="status-dot" /><div><small>Version publiée</small><strong>v{configuration.publishedVersion}</strong></div></div>
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon />{label}</button>)}
      <div className="admin-actions"><button className="button button--quiet" disabled={busy} onClick={() => save()}><Save /> Enregistrer</button><button className="button button--primary" disabled={busy} onClick={() => save(true)}><UploadCloud /> Publier</button></div>
    </aside>
    <div className="admin-content">
      {message && <p className="admin-message" role="status">{message}</p>}
      {tab === "game" && <AdminSection icon={Building2} eyebrow="Univers global" title="Jeu, histoire et catégories">
        <div className="admin-grid">
          <Field label="Nom du jeu"><input value={document.game.name} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, game: { ...value.document.game, name: event.target.value } } }))} /></Field>
          <Field label="Type d’organisation"><select value={document.organizationType} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, organizationType: event.target.value as typeof document.organizationType } }))}><option>School</option><option>Company</option><option>TrainingProvider</option><option>Community</option><option>Custom</option></select></Field>
          <Field label="Nom de l’organisation"><input value={document.organization.name} onChange={(event) => updateOrganization("name", event.target.value, update)} /></Field>
          <Field label="Description de l’organisation"><input value={document.organization.description} onChange={(event) => updateOrganization("description", event.target.value, update)} /></Field>
          <Field label="Description" wide><textarea value={document.game.description} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, game: { ...value.document.game, description: event.target.value } } }))} /></Field>
          <Field label="Histoire globale" wide><textarea className="large" value={document.game.globalStory} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, game: { ...value.document.game, globalStory: event.target.value } } }))} /></Field>
        </div>
        <div className="config-cards">{document.categories.map((category, index) => <article key={category.id}><span className="category-gem" data-accent={category.accent} /><input value={category.name} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, categories: value.document.categories.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) } }))} /><textarea value={category.description} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, categories: value.document.categories.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) } }))} /></article>)}</div>
        <h3>Structure de l’organisation</h3>
        <p className="scene-copy">Composez librement établissements, campus, classes et groupes, ou entreprises, départements et équipes. Le parent construit la hiérarchie.</p>
        <div className="config-cards">{[...document.organization.units].sort((left, right) => left.order - right.order).map((unit) => <article key={unit.id}>
          <div className="admin-grid"><Field label="Type"><input value={unit.type} onChange={(event) => updateOrganizationUnit(unit.id, "type", event.target.value, update)} /></Field><Field label="Code"><input value={unit.code} onChange={(event) => updateOrganizationUnit(unit.id, "code", event.target.value, update)} /></Field></div>
          <input value={unit.name} aria-label="Nom de l’unité" onChange={(event) => updateOrganizationUnit(unit.id, "name", event.target.value, update)} />
          <textarea value={unit.description} aria-label="Description de l’unité" onChange={(event) => updateOrganizationUnit(unit.id, "description", event.target.value, update)} />
          <Field label="Parent"><select value={unit.parentId ?? ""} onChange={(event) => updateOrganizationUnit(unit.id, "parentId", event.target.value || undefined, update)}><option value="">Racine</option>{document.organization.units.filter((candidate) => candidate.id !== unit.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></Field>
        </article>)}</div>
        <button className="button button--quiet" onClick={() => update((value) => ({ ...value, document: { ...value.document, organization: { ...value.document.organization, units: [...value.document.organization.units, { id: crypto.randomUUID(), type: defaultUnitType(value.document.organizationType), name: "Nouvelle unité", code: "", description: "", order: value.document.organization.units.length + 1, enabled: true }] } } }))}><Plus /> Ajouter une unité</button>
      </AdminSection>}
      {tab === "access" && <AdminSection icon={ShieldCheck} eyebrow="RBAC explicable" title="Rôles et permissions">
        <div className="role-list">{roles.map((role) => <article key={role.id}><div><strong>{role.name}</strong>{role.isSystem && <span>Système</span>}<p>{role.description}</p></div><small>{role.permissions.length} permissions</small><div className="permission-pills">{role.permissions.map((permission) => <span key={permission}>{permission}</span>)}</div></article>)}</div>
        <div className="role-builder"><h3><Plus /> Nouveau rôle personnalisé</h3><div className="admin-grid"><Field label="Nom"><input value={roleName} onChange={(event) => setRoleName(event.target.value)} /></Field><Field label="Description"><input value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} /></Field></div><div className="permission-picker">{permissions.map((permission) => <label key={permission.code}><input type="checkbox" checked={rolePermissions.includes(permission.code)} onChange={() => setRolePermissions((value) => value.includes(permission.code) ? value.filter((code) => code !== permission.code) : [...value, permission.code])} /><span><strong>{permission.code}</strong><small>{permission.description}</small></span></label>)}</div><button className="button button--primary" disabled={busy || !roleName || rolePermissions.length === 0} onClick={createRole}><Plus /> Créer le rôle</button></div>
        <div className="role-builder"><h3><ShieldCheck /> Affecter un rôle</h3><p className="scene-copy">Utilisez l’identifiant stable du compte. Le scope optionnel prépare les périmètres école, classe, entreprise ou équipe.</p><div className="admin-grid"><Field label="ID utilisateur"><input value={assignmentUserId} onChange={(event) => setAssignmentUserId(event.target.value)} placeholder="UUID du compte" /></Field><Field label="Rôle"><select value={assignmentRoleId} onChange={(event) => setAssignmentRoleId(event.target.value)}><option value="">Sélectionner…</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></Field><Field label="Scope optionnel"><input value={assignmentScope} onChange={(event) => setAssignmentScope(event.target.value)} placeholder="ex. class:6e-a" /></Field></div><button className="button button--primary" disabled={busy || !assignmentUserId || !assignmentRoleId} onClick={assignRole}><ShieldCheck /> Affecter</button></div>
      </AdminSection>}
      {tab === "ai" && <AdminSection icon={Bot} eyebrow="Provider & compagnon" title="IA et expérience du familier">
        {foundry && <div className="provider-card"><div className="provider-heading"><span className="azure-mark">A</span><div><strong>Azure AI Foundry</strong><small>OpenAI v1 · DefaultAzureCredential</small></div><label className="switch"><input type="checkbox" checked={foundry.enabled} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, aiProviders: value.document.aiProviders.map((item) => item.id === foundry.id ? { ...item, enabled: event.target.checked } : item) } }))} /><span /></label></div><div className="admin-grid"><Field label="Endpoint"><input value={foundry.endpoint} onChange={(event) => updateProvider(foundry.id, "endpoint", event.target.value, update)} /></Field><Field label="Déploiement"><input value={foundry.deployment} onChange={(event) => updateProvider(foundry.id, "deployment", event.target.value, update)} /></Field><Field label="Référence de secret"><input value={foundry.secretReference ?? ""} onChange={(event) => updateProvider(foundry.id, "secretReference", event.target.value, update)} /></Field><Field label="Authentification"><input value={foundry.authentication} disabled /></Field></div></div>}
        {familiar && <div className="familiar-admin"><div className="familiar-orb">✦</div><div><p className="eyebrow">Profil par défaut</p><h3>{familiar.name}</h3><p>{familiar.description}</p></div><div className="admin-grid"><Field label="Style d’écriture"><input value={familiar.writingStyle} onChange={(event) => updateFamiliar("writingStyle", event.target.value, update)} /></Field><Field label="Niveau d’aide"><input type="range" min="0" max="5" value={familiar.helpLevel} onChange={(event) => updateFamiliar("helpLevel", Number(event.target.value), update)} /><small>{familiar.helpLevel}/5</small></Field></div></div>}
      </AdminSection>}
      {tab === "auth" && <AdminSection icon={KeyRound} eyebrow="Accès cumulatif ou exclusif" title="Authentification">
        <div className="choice-cards">{(["LocalOnly", "Cumulative", "EntraOnly"] as const).map((mode) => <button key={mode} className={document.authentication.mode === mode ? "is-selected" : ""} onClick={() => update((value) => ({ ...value, document: { ...value.document, authentication: { ...value.document.authentication, mode, localEnabled: mode !== "EntraOnly", entraEnabled: mode !== "LocalOnly" } } }))}><Check /> <strong>{mode === "LocalOnly" ? "Compte GenEngine" : mode === "EntraOnly" ? "Microsoft uniquement" : "Les deux méthodes"}</strong><small>{mode}</small></button>)}</div>
        <div className="admin-grid"><Field label="Tenant Entra ID"><input value={document.authentication.entraTenantId ?? ""} onChange={(event) => updateAuth("entraTenantId", event.target.value, update)} /></Field><Field label="Client ID"><input value={document.authentication.entraClientId ?? ""} onChange={(event) => updateAuth("entraClientId", event.target.value, update)} /></Field></div>
      </AdminSection>}
      {tab === "economy" && <AdminSection icon={Coins} eyebrow="Progression et engagement" title="Monnaie, récompenses et magasin">
        <div className="currency-card"><span>{document.economy.currencyIcon}</span><div><input value={document.economy.currencyName} onChange={(event) => updateEconomy("currencyName", event.target.value, update)} /><small>Code <input value={document.economy.currencyCode} onChange={(event) => updateEconomy("currencyCode", event.target.value, update)} /></small></div></div>
        <h3>Règles de gain</h3><div className="rule-list">{document.economy.rewardRules.map((rule) => <article key={rule.trigger + rule.referenceId}><Coins /><div><strong>+{rule.amount} {document.economy.currencyCode}</strong><p>{rule.description}</p></div><small>{rule.trigger} · {rule.referenceId}</small></article>)}</div>
        <h3>Offres du magasin</h3><div className="config-cards">{document.economy.offers.map((offer) => <article key={offer.id}><span className="offer-price">{offer.price} {document.economy.currencyIcon}</span><strong>{offer.name}</strong><p>{offer.description}</p><small>{offer.rewardType}</small></article>)}</div>
      </AdminSection>}
    </div>
  </section>;
}

function AdminSection({ icon: Icon, eyebrow, title, children }: { icon: typeof Sparkles; eyebrow: string; title: string; children: React.ReactNode }) {
  return <div className="admin-section"><header><Icon /><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></header>{children}</div>;
}
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "field-wide" : ""}><span>{label}</span>{children}</label>; }
function updateProvider(id: string, key: "endpoint" | "deployment" | "secretReference", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, aiProviders: current.document.aiProviders.map((provider) => provider.id === id ? { ...provider, [key]: value } : provider) } })); }
function updateFamiliar(key: "writingStyle" | "helpLevel", value: string | number, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, familiars: current.document.familiars.map((familiar, index) => index === 0 ? { ...familiar, [key]: value } : familiar) } })); }
function updateAuth(key: "entraTenantId" | "entraClientId", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, authentication: { ...current.document.authentication, [key]: value } } })); }
function updateEconomy(key: "currencyName" | "currencyCode", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, economy: { ...current.document.economy, [key]: value } } })); }
function updateOrganization(key: "name" | "description", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, organization: { ...current.document.organization, [key]: value } } })); }
function updateOrganizationUnit(id: string, key: "type" | "name" | "code" | "description" | "parentId", value: string | undefined, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, organization: { ...current.document.organization, units: current.document.organization.units.map((unit) => unit.id === id ? { ...unit, [key]: value } : unit) } } })); }
function defaultUnitType(type: ExperienceDocumentContract["organizationType"]) { if (type === "School") return "Class"; if (type === "Company") return "Team"; if (type === "TrainingProvider") return "Cohort"; return "Group"; }
async function read<T>(response: Response): Promise<T> { if (!response.ok) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; throw new Error(problem?.detail ?? "Accès refusé ou service indisponible."); } return response.json() as Promise<T>; }
function asMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur inattendue est survenue."; }
