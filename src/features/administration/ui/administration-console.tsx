"use client";
import { Bot, Building2, Check, Coins, KeyRound, Languages, LibraryBig, LoaderCircle, Plus, Save, Search, ShieldCheck, Sparkles, Trash2, UploadCloud, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminConfigurationContract, AdminUserContract, ExperienceDocumentContract, PagedUsersContract, PermissionContract, ProblemDetailsContract, RoleContract } from "@/shared/api/contracts";

type Tab = "game" | "player" | "catalog" | "language" | "users" | "access" | "ai" | "auth" | "economy";
const tabs: Array<{ id: Tab; label: string; group: string; icon: typeof Sparkles }> = [
  { id: "game", label: "Jeu & organisation", group: "Expérience", icon: Sparkles },
  { id: "player", label: "Accueil, aide & tutoriel", group: "Expérience", icon: Sparkles },
  { id: "catalog", label: "Parcours & catégories", group: "Expérience", icon: LibraryBig },
  { id: "language", label: "Libellés", group: "Expérience", icon: Languages },
  { id: "users", label: "Utilisateurs", group: "Identité & sécurité", icon: Users },
  { id: "access", label: "Rôles & permissions", group: "Identité & sécurité", icon: ShieldCheck },
  { id: "auth", label: "Authentification", group: "Identité & sécurité", icon: KeyRound },
  { id: "ai", label: "IA & familiers", group: "Services", icon: Bot },
  { id: "economy", label: "Économie & magasin", group: "Services", icon: Coins },
];

export function AdministrationConsole() {
  const [tab, setTab] = useState<Tab>("game");
  const [configuration, setConfiguration] = useState<AdminConfigurationContract>();
  const [roles, setRoles] = useState<RoleContract[]>([]);
  const [permissions, setPermissions] = useState<PermissionContract[]>([]);
  const [users, setUsers] = useState<AdminUserContract[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userQuery, setUserQuery] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [assignmentRoleId, setAssignmentRoleId] = useState("");
  const [assignmentScope, setAssignmentScope] = useState("");
  const [newLabelKey, setNewLabelKey] = useState("");
  const [newLabelValue, setNewLabelValue] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string>();

  async function load() {
    setBusy(true);
    try {
      const [configResponse, accessResponse, usersResponse] = await Promise.all([fetch("/api/admin/configuration"), fetch("/api/admin/access"), fetch(`/api/admin/users?query=${encodeURIComponent(userQuery)}`)]);
      setConfiguration(await read<AdminConfigurationContract>(configResponse));
      const access = await read<{ roles: RoleContract[]; permissions: PermissionContract[] }>(accessResponse);
      setRoles(access.roles); setPermissions(access.permissions);
      const userPage = await read<PagedUsersContract>(usersResponse); setUsers(userPage.items); setUsersTotal(userPage.total);
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/admin/configuration", { signal: controller.signal }),
      fetch("/api/admin/access", { signal: controller.signal }),
      fetch("/api/admin/users", { signal: controller.signal }),
    ]).then(async ([configResponse, accessResponse, usersResponse]) => {
      setConfiguration(await read<AdminConfigurationContract>(configResponse));
      const access = await read<{ roles: RoleContract[]; permissions: PermissionContract[] }>(accessResponse);
      setRoles(access.roles); setPermissions(access.permissions);
      const userPage = await read<PagedUsersContract>(usersResponse); setUsers(userPage.items); setUsersTotal(userPage.total);
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
      setAssignmentUserId(""); setAssignmentScope(""); setMessage("Rôle affecté à l’utilisateur."); await load();
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }
  async function mutateUser(user: AdminUserContract, action: "toggle" | "delete") {
    if (action === "delete" && !window.confirm(`Supprimer le compte ${user.userName} ? Cette suppression est logique et conserve les traces d’audit.`)) return;
    await runMutation(async () => {
      const response = await fetch(`/api/admin/users/${user.id}`, action === "toggle" ? { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !user.isActive }) } : { method: "DELETE" });
      if (!response.ok) await read<void>(response);
      await load();
    }, action === "delete" ? "Compte supprimé." : user.isActive ? "Compte désactivé." : "Compte réactivé.");
  }
  async function deleteRole(role: RoleContract) {
    if (!window.confirm(`Supprimer le rôle ${role.name} ?`)) return;
    await runMutation(async () => { const response = await fetch(`/api/admin/access/roles/${role.id}`, { method: "DELETE" }); if (!response.ok) await read<void>(response); await load(); }, "Rôle supprimé.");
  }
  async function runMutation(operation: () => Promise<void>, success: string) { setBusy(true); setMessage(undefined); try { await operation(); setMessage(success); } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); } }
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
      {tabs.map(({ id, label, group, icon: Icon }, index) => <div key={id}>{index === 0 || tabs[index - 1]?.group !== group ? <small className="admin-nav-group">{group}</small> : null}<button className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon />{label}</button></div>)}
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
        <h3>Structure de l’organisation</h3>
        <p className="scene-copy">Composez librement établissements, campus, classes et groupes, ou entreprises, départements et équipes. Le parent construit la hiérarchie.</p>
        <div className="config-cards">{[...document.organization.units].sort((left, right) => left.order - right.order).map((unit) => <article key={unit.id}>
          <button className="icon-danger" aria-label={`Supprimer ${unit.name}`} onClick={() => update((value) => ({ ...value, document: { ...value.document, organization: { ...value.document.organization, units: value.document.organization.units.filter((item) => item.id !== unit.id).map((item) => item.parentId === unit.id ? { ...item, parentId: undefined } : item), }, assignments: value.document.assignments.filter((item) => item.organizationUnitId !== unit.id) } }))}><Trash2 /></button>
          <div className="admin-grid"><Field label="Type"><input value={unit.type} onChange={(event) => updateOrganizationUnit(unit.id, "type", event.target.value, update)} /></Field><Field label="Code"><input value={unit.code} onChange={(event) => updateOrganizationUnit(unit.id, "code", event.target.value, update)} /></Field></div>
          <input value={unit.name} aria-label="Nom de l’unité" onChange={(event) => updateOrganizationUnit(unit.id, "name", event.target.value, update)} />
          <textarea value={unit.description} aria-label="Description de l’unité" onChange={(event) => updateOrganizationUnit(unit.id, "description", event.target.value, update)} />
          <Field label="Parent"><select value={unit.parentId ?? ""} onChange={(event) => updateOrganizationUnit(unit.id, "parentId", event.target.value || undefined, update)}><option value="">Racine</option>{document.organization.units.filter((candidate) => candidate.id !== unit.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></Field>
        </article>)}</div>
        <button className="button button--quiet" onClick={() => update((value) => ({ ...value, document: { ...value.document, organization: { ...value.document.organization, units: [...value.document.organization.units, { id: crypto.randomUUID(), type: defaultUnitType(value.document.organizationType), name: "Nouvelle unité", code: "", description: "", order: value.document.organization.units.length + 1, enabled: true }] } } }))}><Plus /> Ajouter une unité</button>
      </AdminSection>}
      {tab === "player" && <AdminSection icon={Sparkles} eyebrow="Flux joueur piloté par le moteur" title="Introduction, tutoriel et aide">
        <h3>Introduction avant connexion</h3>
        <div className="admin-grid">
          <Field label="Introduction active"><label className="switch"><input type="checkbox" checked={document.intro.enabled} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, intro: { ...value.document.intro, enabled: event.target.checked } } }))} /><span /></label></Field>
          <Field label="Politique d’affichage"><select value={document.intro.displayPolicy} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, intro: { ...value.document.intro, displayPolicy: event.target.value as typeof document.intro.displayPolicy } } }))}><option>EveryLaunch</option><option>OncePerVersion</option><option>FirstInstall</option></select></Field>
          <Field label="Scénario du mode démo"><input value={document.demo.scenarioSlug} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, demo: { ...value.document.demo, scenarioSlug: event.target.value } } }))} /></Field>
          <Field label="Durée cible de la démo"><input type="number" min="1" max="120" value={document.demo.targetMinutes} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, demo: { ...value.document.demo, targetMinutes: Number(event.target.value) } } }))} /></Field>
        </div>
        <div className="config-cards">{document.intro.scenes.map((scene, index) => <article key={scene.id}><input value={scene.eyebrow} aria-label="Sur-titre" onChange={(event) => update((value) => ({ ...value, document: { ...value.document, intro: { ...value.document.intro, scenes: value.document.intro.scenes.map((item) => item.id === scene.id ? { ...item, eyebrow: event.target.value } : item) } } }))} /><input value={scene.title} aria-label="Titre" onChange={(event) => update((value) => ({ ...value, document: { ...value.document, intro: { ...value.document.intro, scenes: value.document.intro.scenes.map((item) => item.id === scene.id ? { ...item, title: event.target.value } : item) } } }))} /><textarea value={scene.body} aria-label="Texte" onChange={(event) => update((value) => ({ ...value, document: { ...value.document, intro: { ...value.document.intro, scenes: value.document.intro.scenes.map((item) => item.id === scene.id ? { ...item, body: event.target.value } : item) } } }))} /><Field label="Image HTTPS"><input value={scene.imageUrl ?? ""} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, intro: { ...value.document.intro, scenes: value.document.intro.scenes.map((item) => item.id === scene.id ? { ...item, imageUrl: event.target.value || undefined } : item) } } }))} /></Field><small>Scène {index + 1}</small></article>)}</div>
        <button className="button button--quiet" onClick={() => update((value) => ({ ...value, document: { ...value.document, intro: { ...value.document.intro, scenes: [...value.document.intro.scenes, { id: crypto.randomUUID(), eyebrow: value.document.game.name, title: "Nouvelle scène", body: "", order: value.document.intro.scenes.length + 1 }] } } }))}><Plus /> Ajouter une scène</button>
        <h3>Tutoriel et compagnon</h3>
        <div className="admin-grid"><Field label="Version du tutoriel"><input type="number" min="1" value={document.onboarding.version} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, onboarding: { ...value.document.onboarding, version: Number(event.target.value) } } }))} /></Field><Field label="Fréquence par défaut du compagnon"><input type="range" min="0" max="5" value={document.assistantPolicy.defaultFrequency} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, assistantPolicy: { ...value.document.assistantPolicy, defaultFrequency: Number(event.target.value) } } }))} /><small>{document.assistantPolicy.defaultFrequency}/5</small></Field></div>
        <div className="config-cards">{document.onboarding.steps.sort((left, right) => left.order - right.order).map((step) => <article key={step.id}><input value={step.title} aria-label="Titre de l’étape" onChange={(event) => update((value) => ({ ...value, document: { ...value.document, onboarding: { ...value.document.onboarding, steps: value.document.onboarding.steps.map((item) => item.id === step.id ? { ...item, title: event.target.value } : item) } } }))} /><textarea value={step.body} aria-label="Texte de l’étape" onChange={(event) => update((value) => ({ ...value, document: { ...value.document, onboarding: { ...value.document.onboarding, steps: value.document.onboarding.steps.map((item) => item.id === step.id ? { ...item, body: event.target.value } : item) } } }))} /><Field label="Cible UI"><input value={step.target} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, onboarding: { ...value.document.onboarding, steps: value.document.onboarding.steps.map((item) => item.id === step.id ? { ...item, target: event.target.value } : item) } } }))} /></Field></article>)}</div>
        <h3>Centre d’aide</h3>
        <div className="config-cards">{document.help.articles.map((article) => <article key={article.id}><input value={article.title} aria-label="Titre de l’article" onChange={(event) => update((value) => ({ ...value, document: { ...value.document, help: { ...value.document.help, articles: value.document.help.articles.map((item) => item.id === article.id ? { ...item, title: event.target.value } : item) } } }))} /><input value={article.summary} aria-label="Résumé" onChange={(event) => update((value) => ({ ...value, document: { ...value.document, help: { ...value.document.help, articles: value.document.help.articles.map((item) => item.id === article.id ? { ...item, summary: event.target.value } : item) } } }))} /><textarea value={article.body} aria-label="Contenu" onChange={(event) => update((value) => ({ ...value, document: { ...value.document, help: { ...value.document.help, articles: value.document.help.articles.map((item) => item.id === article.id ? { ...item, body: event.target.value } : item) } } }))} /></article>)}</div>
      </AdminSection>}
      {tab === "catalog" && <AdminSection icon={LibraryBig} eyebrow="Architecture de l’expérience" title="Parcours, catégories et affectations">
        <p className="scene-copy">Les parcours ordonnent des catégories réutilisables. Chaque catégorie référence les scénarios publiés qui lui appartiennent.</p>
        <h3>Parcours</h3><div className="config-cards">{document.journeys.map((journey, index) => <article key={journey.id}><button className="icon-danger" aria-label={`Supprimer ${journey.name}`} onClick={() => update((value) => ({ ...value, document: { ...value.document, journeys: value.document.journeys.filter((item) => item.id !== journey.id), assignments: value.document.assignments.filter((item) => item.contentId !== journey.id) } }))}><Trash2 /></button><input value={journey.name} aria-label="Nom du parcours" onChange={(event) => updateJourney(index, "name", event.target.value, update)} /><textarea value={journey.description} aria-label="Description du parcours" onChange={(event) => updateJourney(index, "description", event.target.value, update)} /><Field label="Image HTTPS"><input value={journey.imageUrl ?? ""} onChange={(event) => updateJourney(index, "imageUrl", event.target.value, update)} /></Field><div className="permission-picker">{document.categories.map((category) => <label key={category.id}><input type="checkbox" checked={journey.categoryIds.includes(category.id)} onChange={() => update((value) => ({ ...value, document: { ...value.document, journeys: value.document.journeys.map((item) => item.id === journey.id ? { ...item, categoryIds: item.categoryIds.includes(category.id) ? item.categoryIds.filter((id) => id !== category.id) : [...item.categoryIds, category.id] } : item) } }))} /><span><strong>{category.name}</strong><small>{category.description}</small></span></label>)}</div></article>)}</div>
        <button className="button button--quiet" onClick={() => update((value) => ({ ...value, document: { ...value.document, journeys: [...value.document.journeys, { id: crypto.randomUUID(), name: "Nouveau parcours", description: "", accent: "ember", order: value.document.journeys.length + 1, isVisible: true, categoryIds: [], prerequisiteJourneyIds: [], tags: [] }] } }))}><Plus /> Ajouter un parcours</button>
        <h3>Catégories</h3><div className="config-cards">{document.categories.map((category, index) => <article key={category.id}><button className="icon-danger" aria-label={`Supprimer ${category.name}`} onClick={() => update((value) => ({ ...value, document: { ...value.document, categories: value.document.categories.filter((item) => item.id !== category.id), journeys: value.document.journeys.map((journey) => ({ ...journey, categoryIds: journey.categoryIds.filter((id) => id !== category.id) })), assignments: value.document.assignments.filter((item) => item.contentId !== category.id) } }))}><Trash2 /></button><span className="category-gem" data-accent={category.accent} /><input value={category.name} onChange={(event) => updateCategory(index, "name", event.target.value, update)} /><textarea value={category.description} onChange={(event) => updateCategory(index, "description", event.target.value, update)} /><Field label="Image HTTPS"><input value={category.imageUrl ?? ""} onChange={(event) => updateCategory(index, "imageUrl", event.target.value, update)} /></Field><Field label="IDs scénarios (séparés par des virgules)"><input value={category.scenarioIds.join(", ")} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, categories: value.document.categories.map((item) => item.id === category.id ? { ...item, scenarioIds: event.target.value.split(",").map((id) => id.trim()).filter(Boolean) } : item) } }))} /></Field></article>)}</div>
        <button className="button button--quiet" onClick={() => update((value) => ({ ...value, document: { ...value.document, categories: [...value.document.categories, { id: crypto.randomUUID(), name: "Nouvelle catégorie", description: "", accent: "verdigris", order: value.document.categories.length + 1, isVisible: true, tags: [], scenarioIds: [] }] } }))}><Plus /> Ajouter une catégorie</button>
      </AdminSection>}
      {tab === "language" && <AdminSection icon={Languages} eyebrow="Aucun texte imposé" title="Libellés et vocabulaire du jeu">
        <p className="scene-copy">Chaque texte est identifié par une clé stable et publié avec le jeu. Les clients utilisent ces valeurs avec un fallback sûr.</p>
        <div className="config-cards">{Object.entries(document.language.labels).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => <article key={key}>
          <div className="provider-heading"><code>{key}</code><button className="button button--quiet" aria-label={`Supprimer ${key}`} onClick={() => updateLanguageLabel(key, undefined, update)}><Trash2 /></button></div>
          <textarea value={value} aria-label={`Valeur de ${key}`} onChange={(event) => updateLanguageLabel(key, event.target.value, update)} />
        </article>)}</div>
        <div className="role-builder"><h3><Plus /> Ajouter un libellé</h3><div className="admin-grid"><Field label="Clé namespacée"><input value={newLabelKey} onChange={(event) => setNewLabelKey(event.target.value)} placeholder="ex. home.featured.title" /></Field><Field label="Texte"><input value={newLabelValue} onChange={(event) => setNewLabelValue(event.target.value)} /></Field></div><button className="button button--primary" disabled={!newLabelKey.trim() || !newLabelValue.trim() || Boolean(document.language.labels[newLabelKey.trim()])} onClick={() => { updateLanguageLabel(newLabelKey.trim(), newLabelValue.trim(), update); setNewLabelKey(""); setNewLabelValue(""); }}><Plus /> Ajouter</button></div>
        {familiar && <div className="role-builder"><h3>Nom et personnalité du familier par défaut</h3><div className="admin-grid"><Field label="Nom affiché"><input value={familiar.name} onChange={(event) => updateFamiliar("name", event.target.value, update)} /></Field><Field label="Description"><input value={familiar.description} onChange={(event) => updateFamiliar("description", event.target.value, update)} /></Field></div></div>}
      </AdminSection>}
      {tab === "access" && <AdminSection icon={ShieldCheck} eyebrow="RBAC explicable" title="Rôles et permissions">
        <div className="role-list">{roles.map((role) => <article key={role.id}><div><strong>{role.name}</strong>{role.isSystem && <span>Système</span>}<p>{role.description}</p></div><small>{role.permissions.length} permissions</small>{!role.isSystem && <button className="icon-danger" aria-label={`Supprimer ${role.name}`} onClick={() => deleteRole(role)}><Trash2 /></button>}<div className="permission-pills">{role.permissions.map((permission) => <span key={permission}>{permission}</span>)}</div></article>)}</div>
        <div className="role-builder"><h3><Plus /> Nouveau rôle personnalisé</h3><div className="admin-grid"><Field label="Nom"><input value={roleName} onChange={(event) => setRoleName(event.target.value)} /></Field><Field label="Description"><input value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} /></Field></div><div className="permission-picker">{permissions.map((permission) => <label key={permission.code}><input type="checkbox" checked={rolePermissions.includes(permission.code)} onChange={() => setRolePermissions((value) => value.includes(permission.code) ? value.filter((code) => code !== permission.code) : [...value, permission.code])} /><span><strong>{permission.code}</strong><small>{permission.description}</small></span></label>)}</div><button className="button button--primary" disabled={busy || !roleName || rolePermissions.length === 0} onClick={createRole}><Plus /> Créer le rôle</button></div>
        <div className="role-builder"><h3><ShieldCheck /> Affecter un rôle</h3><p className="scene-copy">Utilisez l’identifiant stable du compte. Le scope optionnel prépare les périmètres école, classe, entreprise ou équipe.</p><div className="admin-grid"><Field label="ID utilisateur"><input value={assignmentUserId} onChange={(event) => setAssignmentUserId(event.target.value)} placeholder="UUID du compte" /></Field><Field label="Rôle"><select value={assignmentRoleId} onChange={(event) => setAssignmentRoleId(event.target.value)}><option value="">Sélectionner…</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></Field><Field label="Scope optionnel"><input value={assignmentScope} onChange={(event) => setAssignmentScope(event.target.value)} placeholder="ex. class:6e-a" /></Field></div><button className="button button--primary" disabled={busy || !assignmentUserId || !assignmentRoleId} onClick={assignRole}><ShieldCheck /> Affecter</button></div>
      </AdminSection>}
      {tab === "users" && <AdminSection icon={Users} eyebrow="Identité exploitable" title={`${usersTotal} utilisateurs`}><div className="admin-search"><Search /><input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="Rechercher par identifiant…" /><button className="button button--quiet" onClick={load}>Rechercher</button></div><div className="user-table">{users.map((user) => <article key={user.id}><div className="user-avatar">{user.userName.slice(0, 2).toUpperCase()}</div><div><strong>{user.userName}</strong><small>{user.externalProvider ? `Microsoft · ${user.externalProvider}` : "Compte GenEngine"}</small><div className="permission-pills">{user.roleAssignments.map((assignment) => <span key={`${assignment.roleId}-${assignment.scope}`}>{assignment.roleName} · {assignment.scope}</span>)}</div></div><span className={user.isActive ? "user-state is-active" : "user-state"}>{user.isActive ? "Actif" : "Désactivé"}</span><div className="user-actions"><button className="button button--quiet" onClick={() => mutateUser(user, "toggle")}>{user.isActive ? "Désactiver" : "Réactiver"}</button><button className="icon-danger" aria-label={`Supprimer ${user.userName}`} onClick={() => mutateUser(user, "delete")}><Trash2 /></button></div></article>)}</div></AdminSection>}
      {tab === "ai" && <AdminSection icon={Bot} eyebrow="Provider & compagnon" title="IA et expérience du familier">
        {foundry && <div className="provider-card"><div className="provider-heading"><span className="azure-mark">A</span><div><strong>Azure AI Foundry</strong><small>OpenAI v1 · DefaultAzureCredential</small></div><label className="switch"><input type="checkbox" checked={foundry.enabled} onChange={(event) => update((value) => ({ ...value, document: { ...value.document, aiProviders: value.document.aiProviders.map((item) => item.id === foundry.id ? { ...item, enabled: event.target.checked } : item) } }))} /><span /></label></div><div className="admin-grid"><Field label="Endpoint"><input value={foundry.endpoint} onChange={(event) => updateProvider(foundry.id, "endpoint", event.target.value, update)} /></Field><Field label="Déploiement"><input value={foundry.deployment} onChange={(event) => updateProvider(foundry.id, "deployment", event.target.value, update)} /></Field><Field label="Référence de secret"><input value={foundry.secretReference ?? ""} onChange={(event) => updateProvider(foundry.id, "secretReference", event.target.value, update)} /></Field><Field label="Authentification"><input value={foundry.authentication} disabled /></Field></div></div>}
        {familiar && <div className="familiar-admin">{familiar.portraitUrl ? <img className="familiar-preview" src={familiar.portraitUrl} alt={familiar.name} /> : <div className="familiar-orb">✦</div>}<div><p className="eyebrow">Profil par défaut</p><h3>{familiar.name}</h3><p>{familiar.description}</p></div><div className="admin-grid"><Field label="Portrait HTTPS"><input value={familiar.portraitUrl ?? ""} onChange={(event) => updateFamiliar("portraitUrl", event.target.value, update)} /></Field><Field label="Avatar HTTPS"><input value={familiar.avatarUrl ?? ""} onChange={(event) => updateFamiliar("avatarUrl", event.target.value, update)} /></Field><Field label="Arrière-plan HTTPS"><input value={familiar.backgroundUrl ?? ""} onChange={(event) => updateFamiliar("backgroundUrl", event.target.value, update)} /></Field><Field label="Licence"><input value={familiar.license ?? ""} onChange={(event) => updateFamiliar("license", event.target.value, update)} /></Field><Field label="Attribution"><input value={familiar.attribution ?? ""} onChange={(event) => updateFamiliar("attribution", event.target.value, update)} /></Field><Field label="Style d’écriture"><input value={familiar.writingStyle} onChange={(event) => updateFamiliar("writingStyle", event.target.value, update)} /></Field><Field label="Niveau d’aide"><input type="range" min="0" max="5" value={familiar.helpLevel} onChange={(event) => updateFamiliar("helpLevel", Number(event.target.value), update)} /><small>{familiar.helpLevel}/5</small></Field></div></div>}
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
function updateFamiliar(key: "name" | "description" | "writingStyle" | "helpLevel" | "portraitUrl" | "avatarUrl" | "backgroundUrl" | "license" | "attribution", value: string | number, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, familiars: current.document.familiars.map((familiar, index) => index === 0 ? { ...familiar, [key]: value } : familiar) } })); }
function updateJourney(index: number, key: "name" | "description" | "imageUrl", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, journeys: current.document.journeys.map((journey, itemIndex) => itemIndex === index ? { ...journey, [key]: value } : journey) } })); }
function updateCategory(index: number, key: "name" | "description" | "imageUrl", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, categories: current.document.categories.map((category, itemIndex) => itemIndex === index ? { ...category, [key]: value } : category) } })); }
function updateLanguageLabel(key: string, value: string | undefined, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => { const labels = { ...current.document.language.labels }; if (value === undefined) delete labels[key]; else labels[key] = value; return { ...current, document: { ...current.document, language: { labels } } }; }); }
function updateAuth(key: "entraTenantId" | "entraClientId", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, authentication: { ...current.document.authentication, [key]: value } } })); }
function updateEconomy(key: "currencyName" | "currencyCode", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, economy: { ...current.document.economy, [key]: value } } })); }
function updateOrganization(key: "name" | "description", value: string, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, organization: { ...current.document.organization, [key]: value } } })); }
function updateOrganizationUnit(id: string, key: "type" | "name" | "code" | "description" | "parentId", value: string | undefined, update: (fn: (current: AdminConfigurationContract) => AdminConfigurationContract) => void) { update((current) => ({ ...current, document: { ...current.document, organization: { ...current.document.organization, units: current.document.organization.units.map((unit) => unit.id === id ? { ...unit, [key]: value } : unit) } } })); }
function defaultUnitType(type: ExperienceDocumentContract["organizationType"]) { if (type === "School") return "Class"; if (type === "Company") return "Team"; if (type === "TrainingProvider") return "Cohort"; return "Group"; }
async function read<T>(response: Response): Promise<T> { if (!response.ok) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; throw new Error(problem?.detail ?? "Accès refusé ou service indisponible."); } return response.json() as Promise<T>; }
function asMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur inattendue est survenue."; }
