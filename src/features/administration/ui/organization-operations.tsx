"use client";

import { Building2, CalendarClock, FileUp, Network, Plus, RefreshCw, Trash2, UserRoundCog, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFeedback } from "@/shared/ui/feedback-provider";
import type { AdminUserContract, AssignedContentTypeContract, ExperienceDocumentContract, MembershipImportContract, OrganizationOperationsContract, ProblemDetailsContract } from "@/shared/api/contracts";

export function OrganizationOperations({ users, experience }: { users: AdminUserContract[]; experience: ExperienceDocumentContract }) {
  const feedback = useFeedback();
  const [data, setData] = useState<OrganizationOperationsContract>();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(true);
  const [unitName, setUnitName] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [unitType, setUnitType] = useState(experience.organizationType === "School" ? "Class" : "Team");
  const [unitParentId, setUnitParentId] = useState("");
  const [periodName, setPeriodName] = useState("");
  const [periodCode, setPeriodCode] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [memberUnitId, setMemberUnitId] = useState("");
  const [memberKind, setMemberKind] = useState<"Participant" | "Supervisor">("Participant");
  const [memberPeriodId, setMemberPeriodId] = useState("");
  const [importRows, setImportRows] = useState<MembershipImportRow[]>([]);
  const [importReport, setImportReport] = useState<MembershipImportContract>();
  const [assignmentUnitId, setAssignmentUnitId] = useState("");
  const [contentType, setContentType] = useState<AssignedContentTypeContract>("Journey");
  const [contentId, setContentId] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [required, setRequired] = useState(true);
  const [availableFrom, setAvailableFrom] = useState("");
  const [dueAt, setDueAt] = useState("");

  async function load() {
    setBusy(true);
    try { setData(await read<OrganizationOperationsContract>(await fetch("/api/admin/organization"))); setMessage(undefined); }
    catch (error) { setMessage(asMessage(error)); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/organization", { signal: controller.signal })
      .then((response) => read<OrganizationOperationsContract>(response))
      .then(setData)
      .catch((error: unknown) => { if (!controller.signal.aborted) setMessage(asMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, []);

  const contentOptions = useMemo(() => {
    if (contentType === "Journey") return experience.journeys.map((item) => ({ id: item.id, name: item.name }));
    if (contentType === "Category") return experience.categories.map((item) => ({ id: item.id, name: item.name }));
    return experience.categories.flatMap((category) => category.scenarioIds.map((id) => ({ id, name: `${category.name} · ${id.slice(0, 8)}` })));
  }, [contentType, experience]);

  async function mutate(operation: () => Promise<Response>, success: string) {
    setBusy(true); setMessage(undefined);
    try { await readOptional(await operation()); feedback.succeed(success); await load(); }
    catch (error) { feedback.fail(asMessage(error)); setMessage(asMessage(error)); setBusy(false); }
  }

  /** Une suppression passe toujours par une confirmation explicite. */
  async function confirmThen(options: { title: string; body: string; confirmLabel: string }, operation: () => Promise<Response>, success: string) {
    if (await feedback.confirm({ ...options, destructive: true })) await mutate(operation, success);
  }

  if (!data) return <div className="admin-loading"><Network /><p>{message ?? "Chargement de la structure opérationnelle…"}</p><button className="button button--quiet" onClick={load}><RefreshCw /> Réessayer</button></div>;
  const userById = new Map(users.map((user) => [user.id, user.userName]));
  const unitById = new Map(data.units.map((unit) => [unit.id, unit.name]));

  return <div className="organization-operations">
    <div className="operations-summary">
      <article><Building2 /><strong>{data.front.name}</strong><small>{data.front.type} · {data.front.isActive ? "Actif" : "Suspendu"}</small></article>
      <article><Network /><strong>{data.units.length}</strong><small>unités structurées</small></article>
      <article><CalendarClock /><strong>{data.periods.length}</strong><small>périodes métier</small></article>
      <article><UsersRound /><strong>{data.memberships.total}</strong><small>memberships</small></article>
      <article><CalendarClock /><strong>{data.assignments.total}</strong><small>affectations</small></article>
    </div>

    {message && <p className="form-message">{message}</p>}

    <section className="role-builder assignment-builder">
      <h3><CalendarClock /> Périodes métier</h3>
      <p className="admin-note">Années scolaires, semestres, campagnes ou exercices bornent explicitement les appartenances.</p>
      <div className="assignment-board">{data.periods.map((period) => <article key={period.id}><div><span className="assignment-type">{period.code}</span><strong>{period.name}</strong><small>{formatDate(period.startsAt)} → {formatDate(period.endsAt)}</small></div><span className={period.isActive ? "user-state is-active" : "user-state"}>{period.isActive ? "Active" : "Archivée"}</span></article>)}</div>
      <div className="admin-grid">
        <Field label="Nom"><input value={periodName} onChange={(event) => setPeriodName(event.target.value)} placeholder="Année 2026-2027" /></Field>
        <Field label="Code"><input value={periodCode} onChange={(event) => setPeriodCode(event.target.value)} placeholder="2026-27" /></Field>
        <Field label="Début"><input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></Field>
        <Field label="Fin"><input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></Field>
      </div>
      <button className="button button--primary" disabled={busy || !periodName.trim() || !periodCode.trim() || !periodStart || !periodEnd} onClick={() => mutate(() => fetch(`/api/admin/organization/periods/${crypto.randomUUID()}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: periodName, code: periodCode, startsAt: new Date(`${periodStart}T00:00:00Z`).toISOString(), endsAt: new Date(`${periodEnd}T23:59:59Z`).toISOString(), isActive: true }) }), "Période créée.").then(() => { setPeriodName(""); setPeriodCode(""); })}><Plus /> Ajouter la période</button>
    </section>

    <div className="operations-grid">
      <section className="role-builder">
        <h3><Network /> Unités et groupes</h3>
        <p className="admin-note">Classes, équipes, départements ou cohortes utilisent la même hiérarchie. Les libellés visibles restent configurables.</p>
        <div className="organization-tree">{data.units.map((unit) => <article key={unit.id}><span className="category-gem" data-accent="verdigris" /><div><strong>{unit.name}</strong><small>{unit.type} · {unit.code}{unit.parentId ? ` · sous ${unitById.get(unit.parentId) ?? "unité"}` : " · racine"}</small></div><span className={unit.isActive ? "user-state is-active" : "user-state"}>{unit.isActive ? "Active" : "Inactive"}</span></article>)}</div>
        <div className="admin-grid">
          <Field label="Nom"><input value={unitName} onChange={(event) => setUnitName(event.target.value)} placeholder="Classe Horizon" /></Field>
          <Field label="Code"><input value={unitCode} onChange={(event) => setUnitCode(event.target.value)} placeholder="HORIZON" /></Field>
          <Field label="Type"><input value={unitType} onChange={(event) => setUnitType(event.target.value)} /></Field>
          <Field label="Parent"><select value={unitParentId} onChange={(event) => setUnitParentId(event.target.value)}><option value="">Aucun</option>{data.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field>
        </div>
        <button className="button button--primary" disabled={busy || !unitName.trim() || !unitCode.trim()} onClick={() => mutate(() => fetch(`/api/admin/organization/units/${crypto.randomUUID()}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId: unitParentId || undefined, name: unitName, type: unitType, code: unitCode, isActive: true }) }), "Unité créée.").then(() => { setUnitName(""); setUnitCode(""); })}><Plus /> Ajouter l’unité</button>
      </section>

      <section className="role-builder">
        <h3><UserRoundCog /> Membres et encadrants</h3>
        <p className="admin-note">Une appartenance active détermine le front, le groupe et les contenus accessibles. Le statut d’encadrant n’accorde aucune permission à lui seul.</p>
        <div className="membership-list">{data.memberships.items.map((membership) => <article key={membership.id}><div className="user-avatar">{(userById.get(membership.userId) ?? "??").slice(0, 2).toUpperCase()}</div><div><strong>{userById.get(membership.userId) ?? membership.userId}</strong><small>{membership.kind === "Supervisor" ? "Encadrant" : "Participant"} · {unitById.get(membership.unitId) ?? membership.unitId}{membership.periodId ? ` · ${data.periods.find((period) => period.id === membership.periodId)?.name ?? "période"}` : ""}</small></div><button className="icon-danger" aria-label="Supprimer le membership" onClick={() => void confirmThen({ title: "Retirer cette appartenance ?", body: `${userById.get(membership.userId) ?? membership.userId} ne sera plus rattaché à ${unitById.get(membership.unitId) ?? membership.unitId}.`, confirmLabel: "Retirer" }, () => fetch(`/api/admin/organization/memberships/${membership.id}`, { method: "DELETE" }), "Appartenance supprimée.")}><Trash2 /></button></article>)}</div>
        <div className="admin-grid">
          <Field label="Utilisateur"><select value={memberUserId} onChange={(event) => setMemberUserId(event.target.value)}><option value="">Sélectionner…</option>{users.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.userName}</option>)}</select></Field>
          <Field label="Unité"><select value={memberUnitId} onChange={(event) => setMemberUnitId(event.target.value)}><option value="">Sélectionner…</option>{data.units.filter((unit) => unit.isActive).map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field>
          <Field label="Lien"><select value={memberKind} onChange={(event) => setMemberKind(event.target.value as typeof memberKind)}><option value="Participant">Participant</option><option value="Supervisor">Encadrant</option></select></Field>
          <Field label="Période"><select value={memberPeriodId} onChange={(event) => setMemberPeriodId(event.target.value)}><option value="">Sans période</option>{data.periods.filter((period) => period.isActive).map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}</select></Field>
        </div>
        <button className="button button--primary" disabled={busy || !memberUserId || !memberUnitId} onClick={() => { const period = data.periods.find((item) => item.id === memberPeriodId); return mutate(() => fetch(`/api/admin/organization/memberships/${crypto.randomUUID()}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unitId: memberUnitId, userId: memberUserId, periodId: period?.id, kind: memberKind, startsAt: period?.startsAt ?? new Date().toISOString(), endsAt: period?.endsAt, isActive: true }) }), "Membership créé.").then(() => setMemberUserId("")); }}><Plus /> Ajouter le membership</button>
        <div className="admin-grid">
          <Field label="Import CSV"><input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then((text) => { setImportRows(parseMembershipCsv(text)); setImportReport(undefined); setMessage(undefined); }).catch((error: unknown) => { setImportRows([]); setImportReport(undefined); setMessage(asMessage(error)); }); }} /></Field>
          <p className="admin-note">Colonnes : userId, unitId, periodId, kind, startsAt, endsAt. {importRows.length ? `${importRows.length} ligne(s) prête(s).` : ""}</p>
        </div>
        <div className="button-row">
          <button className="button button--quiet" disabled={busy || importRows.length === 0} onClick={() => importMemberships(importRows, true, setBusy, setMessage, setImportReport)}><FileUp /> Prévisualiser</button>
          <button className="button button--primary" disabled={busy || importRows.length === 0 || !importReport || importReport.errors.length > 0} onClick={() => importMemberships(importRows, false, setBusy, setMessage, setImportReport).then(load)}><FileUp /> Importer</button>
        </div>
        {importReport && <p className="form-message">{importReport.errors.length ? `${importReport.errors.length} erreur(s) : ${importReport.errors.map((error) => `ligne ${error.row} — ${error.message}`).join(" ; ")}` : `${importReport.created} création(s), ${importReport.unchanged} inchangée(s).`}</p>}
      </section>
    </div>

    <section className="role-builder assignment-builder">
      <h3><CalendarClock /> Contenus affectés</h3>
      <p className="admin-note">Les fenêtres et échéances sont évaluées côté moteur. Une suppression retire l’accès futur sans modifier les sessions déjà figées.</p>
      <div className="assignment-board">{data.assignments.items.map((assignment) => <article key={assignment.id}><div><span className="assignment-type">{assignment.contentType}</span><strong>{assignment.name}</strong><small>{unitById.get(assignment.unitId)}{assignment.dueAt ? ` · échéance ${new Intl.DateTimeFormat("fr-FR").format(new Date(assignment.dueAt))}` : ""}</small></div>{assignment.required && <span className="user-state is-active">Obligatoire</span>}<button className="icon-danger" aria-label="Supprimer l’affectation" onClick={() => void confirmThen({ title: "Supprimer cette affectation ?", body: `« ${assignment.name} » ne sera plus attendu de ${unitById.get(assignment.unitId) ?? "cette unité"}.`, confirmLabel: "Supprimer l’affectation" }, () => fetch(`/api/admin/organization/assignments/${assignment.id}`, { method: "DELETE" }), "Affectation supprimée.")}><Trash2 /></button></article>)}</div>
      <div className="admin-grid">
        <Field label="Unité"><select value={assignmentUnitId} onChange={(event) => setAssignmentUnitId(event.target.value)}><option value="">Sélectionner…</option>{data.units.filter((unit) => unit.isActive).map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field>
        <Field label="Type"><select value={contentType} onChange={(event) => { setContentType(event.target.value as AssignedContentTypeContract); setContentId(""); }}><option value="Journey">Parcours</option><option value="Category">Catégorie</option><option value="Scenario">Scénario</option></select></Field>
        <Field label="Contenu"><select value={contentId} onChange={(event) => { const id = event.target.value; setContentId(id); setAssignmentName(contentOptions.find((item) => item.id === id)?.name ?? ""); }}><option value="">Sélectionner…</option>{contentOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Nom opérationnel"><input value={assignmentName} onChange={(event) => setAssignmentName(event.target.value)} /></Field>
        <Field label="Disponible le"><input type="datetime-local" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} /></Field>
        <Field label="Échéance"><input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></Field>
        <label className="check-line"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} /> Affectation obligatoire</label>
      </div>
      <button className="button button--primary" disabled={busy || !assignmentUnitId || !contentId || !assignmentName.trim()} onClick={() => mutate(() => fetch(`/api/admin/organization/assignments/${crypto.randomUUID()}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unitId: assignmentUnitId, contentType, contentId, name: assignmentName, required, availableFrom: availableFrom ? new Date(availableFrom).toISOString() : undefined, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined, isActive: true }) }), "Contenu affecté.").then(() => { setContentId(""); setAssignmentName(""); })}><Plus /> Créer l’affectation</button>
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span>{label}</span>{children}</label>; }
async function read<T>(response: Response): Promise<T> { if (!response.ok) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; throw new Error(problem?.detail ?? "Service d’organisation indisponible."); } return response.json() as Promise<T>; }
async function readOptional(response: Response) { if (!response.ok) await read<never>(response); }
function asMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur inattendue est survenue."; }
type MembershipImportRow = { id: string; userId: string; unitId: string; periodId?: string; kind: "Participant" | "Supervisor"; startsAt: string; endsAt?: string };
function parseMembershipCsv(raw: string): MembershipImportRow[] {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headerLine = lines[0];
  if (!headerLine) return [];
  const headers = headerLine.split(",").map((value) => value.trim());
  for (const required of ["userId", "unitId", "kind", "startsAt"]) if (!headers.includes(required)) throw new Error(`Colonne CSV manquante : ${required}.`);
  return lines.slice(1).map((line, index): MembershipImportRow => {
    const row = Object.fromEntries(headers.map((header, column) => [header, line.split(",")[column]?.trim() ?? ""]));
    const startsAt = new Date(row.startsAt ?? "");
    const endsAt = row.endsAt ? new Date(row.endsAt) : undefined;
    if (!row.userId || !row.unitId || Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime())) || (row.kind !== "Participant" && row.kind !== "Supervisor")) throw new Error(`Ligne CSV ${index + 2} invalide.`);
    return { id: row.id || crypto.randomUUID(), userId: row.userId, unitId: row.unitId, periodId: row.periodId || undefined, kind: row.kind, startsAt: startsAt.toISOString(), endsAt: endsAt?.toISOString() };
  });
}
async function importMemberships(rows: MembershipImportRow[], dryRun: boolean, setBusy: (value: boolean) => void, setMessage: (value?: string) => void, setReport: (value?: MembershipImportContract) => void) {
  setBusy(true); setMessage(undefined);
  try { const report = await read<MembershipImportContract>(await fetch("/api/admin/organization/memberships/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dryRun, rows }) })); setReport(report); setMessage(dryRun ? "Prévalidation terminée." : "Import terminé."); }
  catch (error) { setMessage(asMessage(error)); }
  finally { setBusy(false); }
}
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR").format(new Date(value)); }
