"use client";

import { BookHeart, Check, CircleHelp, Coins, Compass, Gem, LoaderCircle, LogOut, Map, Search, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { JournalContract, OnboardingStateContract, PlayerBootstrapContract, ProblemDetailsContract, UserContextContract } from "@/shared/api/contracts";
import { gameCopy } from "@/shared/lib/game-copy";

type Tab = "map" | "journal" | "companion" | "shop" | "help" | "account";
type Story = { id: string; slug: string; title: string; synopsis: string; durationMinutes: number; scenarioVersionId: string };
type Context = UserContextContract & { bootstrap: PlayerBootstrapContract };

export function PlayerExperienceHub() {
  const [context, setContext] = useState<Context>();
  const [stories, setStories] = useState<Story[]>([]);
  const [journal, setJournal] = useState<JournalContract>();
  const [tab, setTab] = useState<Tab>("map");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState("");
  const [tone, setTone] = useState("");
  const [customName, setCustomName] = useState("");
  const [helpLevel, setHelpLevel] = useState(2);
  const [frequency, setFrequency] = useState(2);
  const [proactive, setProactive] = useState(true);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/me", { signal: controller.signal }).then((response) => read<Context>(response)),
      fetch("/api/catalog", { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<Story[]> : []),
      fetch("/api/player/journal", { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<JournalContract> : undefined),
    ]).then(([value, catalog, timeline]) => {
      setContext(value); setStories(catalog); setJournal(timeline);
      const familiar = value.player.familiarDefinition ?? value.experience.document.familiars[0];
      setForm(value.player.familiar?.form ?? familiar?.form ?? "");
      setTone(value.player.familiar?.tone ?? familiar?.tone ?? "");
      setCustomName(value.player.familiar?.customName ?? familiar?.name ?? "");
      setHelpLevel(value.player.familiar?.helpLevel ?? familiar?.helpLevel ?? 2);
      setFrequency(value.player.familiar?.interventionFrequency ?? value.bootstrap.assistant.defaultFrequency);
      setProactive(value.player.familiar?.proactive ?? value.bootstrap.assistant.proactive);
    }).catch((error: unknown) => setMessage(asMessage(error))).finally(() => setBusy(false));
    return () => controller.abort();
  }, []);

  const categories = context?.experience.document.categories ?? [];
  const filteredStories = useMemo(() => stories.filter((story) => `${story.title} ${story.synopsis}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [query, stories]);

  async function saveFamiliar() {
    if (!context) return;
    const familiar = context.player.familiarDefinition ?? context.experience.document.familiars[0];
    if (!familiar) return;
    await run(async () => {
      const player = await read<Context["player"]>(await fetch("/api/player/familiar", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision: context.player.revision, selection: { familiarId: familiar.id, form, tone, customName, writingStyle: familiar.writingStyle, accent: familiar.accent, helpLevel, interventionFrequency: frequency, proactive } }),
      }));
      setContext({ ...context, player, bootstrap: { ...context.bootstrap, experience: player } });
      setMessage("Votre compagnon est prêt à vous accompagner.");
    });
  }

  async function onboarding(action: "complete" | "skip" | "reset", stepId?: string) {
    if (!context) return;
    await run(async () => {
      const state = await read<OnboardingStateContract>(await fetch("/api/player/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, stepId, idempotencyKey: crypto.randomUUID() }) }));
      const player = { ...context.player, onboarding: state };
      setContext({ ...context, player, bootstrap: { ...context.bootstrap, experience: player, nextAction: state.status === "Completed" || state.status === "Skipped" ? "OpenMap" : context.bootstrap.nextAction } });
    });
  }

  async function purchase(offerId: string) {
    if (!context) return;
    await run(async () => {
      const player = await read<Context["player"]>(await fetch("/api/shop/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId, idempotencyKey: crypto.randomUUID() }) }));
      setContext({ ...context, player, bootstrap: { ...context.bootstrap, experience: player } }); setMessage("Objet ajouté à votre collection.");
    });
  }

  async function signOut() { await fetch("/api/auth", { method: "DELETE" }); window.location.assign("/"); }
  async function run(action: () => Promise<void>) { setBusy(true); setMessage(undefined); try { await action(); } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); } }

  if (!context) return <div className="experience-loading">{busy && <LoaderCircle className="spin" />}<p>{message ?? "Connexion à votre univers…"}</p><Link className="button button--primary" href="/play/demo">Accéder au mode démo</Link></div>;
  const document = context.experience.document;
  const copy = (key: string, fallback: string) => gameCopy(document, key, fallback);
  const familiar = context.player.familiarDefinition ?? document.familiars[0];
  const onboardingPending = context.bootstrap.nextAction !== "OpenMap";
  const tabs: Array<{ id: Tab; label: string; icon: typeof Map }> = [
    { id: "map", label: copy("nav.map", "Carte"), icon: Map }, { id: "journal", label: copy("nav.progress", "Journal"), icon: BookHeart },
    { id: "companion", label: copy("nav.companion", "Compagnon"), icon: Sparkles }, { id: "shop", label: copy("nav.shop", "Magasin"), icon: ShoppingBag },
    { id: "help", label: copy("nav.help", "Aide"), icon: CircleHelp }, { id: "account", label: copy("nav.account", "Compte"), icon: UserRound },
  ];

  return <div className="player-universe">
    {message && <p className="experience-message" role="status">{message}</p>}
    {onboardingPending && <OnboardingPanel context={context} familiar={familiar} busy={busy} onConfigure={() => setTab("companion")} onCommand={onboarding} />}
    <nav className="universe-tabs" aria-label="Votre univers">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon />{label}</button>)}</nav>
    {tab === "map" && <section className="universe-panel world-map"><header><div><p className="eyebrow">{document.game.name}</p><h2>Explorez votre histoire</h2></div><label className="universe-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un scénario…" /></label></header><div className="category-map">{categories.map((category, index) => { const mastery = context.player.masteries.filter((item) => category.scenarioIds.includes(item.scenarioId)); const progress = mastery.length ? Math.round(mastery.reduce((sum, item) => sum + item.masteryPercent, 0) / mastery.length) : 0; return <article key={category.id} style={{ "--map-order": index } as React.CSSProperties}><span className="map-orbit"><Compass /></span><div><p className="eyebrow">Zone {String(index + 1).padStart(2, "0")}</p><h3>{category.name}</h3><p>{category.description}</p><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{progress}% exploré</small></div></article>; })}</div><div className="scenario-shelf">{filteredStories.map((story) => { const mastery = context.player.masteries.find((item) => item.scenarioVersionId === story.scenarioVersionId); return <article key={story.id}><p className="eyebrow">{story.durationMinutes} min</p><h3>{story.title}</h3><p>{story.synopsis}</p><div className="progress-track"><span style={{ width: `${mastery?.masteryPercent ?? 0}%` }} /></div><Link className="button button--primary" href={`/play/${story.scenarioVersionId}`}>{mastery ? "Reprendre l’exploration" : "Commencer"}</Link></article>; })}</div></section>}
    {tab === "journal" && <section className="universe-panel journal-panel"><header><div><p className="eyebrow">Votre parcours</p><h2>Le journal de vos choix</h2></div><strong>{journal?.total ?? 0} traces</strong></header><div className="journal-layout"><div>{(journal?.items ?? context.player.recentJournal).map((entry) => <article key={entry.id}><time>{new Date(entry.occurredAt).toLocaleDateString("fr-FR")}</time><span /><div><p className="eyebrow">{entry.type}</p><h3>{entry.title}</h3><p>{entry.summary}</p></div></article>)}</div><aside><h3>Maîtrise des histoires</h3>{context.player.masteries.map((mastery) => <div key={mastery.scenarioVersionId}><span>{mastery.endingIds.length} fin(s) · {mastery.choiceIds.length} choix</span><b>{mastery.masteryPercent}%</b><div className="progress-track"><span style={{ width: `${mastery.masteryPercent}%` }} /></div></div>)}</aside></div></section>}
    {tab === "companion" && familiar && <section className="familiar-studio"><div className="familiar-preview" style={familiar.backgroundUrl ? { backgroundImage: `linear-gradient(rgb(5 10 12 / 25%), rgb(5 10 12 / 85%)), url(${familiar.backgroundUrl})` } : undefined}>{familiar.portraitUrl || familiar.avatarUrl ? <img src={familiar.portraitUrl ?? familiar.avatarUrl} alt={customName || familiar.name} /> : <span>✦</span>}<strong>{customName || familiar.name}</strong><small>{tone} · aide {helpLevel}/5</small></div><div className="familiar-controls"><p className="eyebrow">Configuration personnelle</p><h2>Une présence vraiment à vous</h2><p>{familiar.description}</p><label>Son nom<input value={customName} maxLength={80} onChange={(event) => setCustomName(event.target.value)} /></label><fieldset><legend>Forme</legend><div className="segmented">{familiar.availableForms.map((value) => <button key={value} className={form === value ? "is-selected" : ""} onClick={() => setForm(value)}>{form === value && <Check />}{value}</button>)}</div></fieldset><fieldset><legend>Ton</legend><div className="segmented">{familiar.availableTones.map((value) => <button key={value} className={tone === value ? "is-selected" : ""} onClick={() => setTone(value)}>{value}</button>)}</div></fieldset><Slider label="Niveau d’aide" value={helpLevel} onChange={setHelpLevel} /><Slider label="Fréquence d’intervention" value={frequency} onChange={setFrequency} /><label className="toggle-line"><input type="checkbox" checked={proactive} onChange={(event) => setProactive(event.target.checked)} /> Me proposer de l’aide au bon moment</label><button className="button button--primary" disabled={busy} onClick={saveFamiliar}><Sparkles /> Enregistrer mon compagnon</button></div></section>}
    {tab === "shop" && <section className="universe-panel shop-section"><header><div><p className="eyebrow">Magasin</p><h2>Des objets gagnés par vos choix</h2></div><span><Coins /> {context.player.balance} {context.player.currencyCode}</span></header><div className="shop-grid">{document.economy.offers.filter((offer) => offer.enabled).map((offer) => { const owned = context.player.ownedOfferIds.includes(offer.id); return <article key={offer.id}><div className="shop-art">{offer.rewardType === "FamiliarCosmetic" ? <Gem /> : <ShoppingBag />}</div><h3>{offer.name}</h3><p>{offer.description}</p><button className={owned ? "button button--quiet" : "button button--primary"} disabled={busy || owned || context.player.balance < offer.price} onClick={() => purchase(offer.id)}>{owned ? "Acquis" : `${offer.price} ${context.player.currencyIcon}`}</button></article>; })}</div></section>}
    {tab === "help" && <section className="universe-panel help-center"><header><p className="eyebrow">Centre d’aide</p><h2>Comprendre sans quitter l’aventure</h2></header><div>{document.help.articles.filter((article) => article.published).map((article) => <details key={article.id}><summary><CircleHelp /><span><strong>{article.title}</strong><small>{article.summary}</small></span></summary><p>{article.body}</p></details>)}</div><aside><h3>Glossaire du monde</h3>{document.help.glossary.map((entry) => <p key={entry.term}><strong>{entry.term}</strong>{entry.definition}</p>)}</aside></section>}
    {tab === "account" && <section className="universe-panel account-panel"><UserRound /><p className="eyebrow">Compte joueur</p><h2>{context.access.userName}</h2><p>Vos sessions, votre tutoriel et votre journal sont synchronisés avec votre compte.</p><button className="button button--quiet" onClick={() => onboarding("reset")}>Recommencer le tutoriel</button><button className="button button--primary" onClick={signOut}><LogOut /> Se déconnecter</button></section>}
  </div>;
}

function OnboardingPanel({ context, familiar, busy, onConfigure, onCommand }: { context: Context; familiar?: Context["experience"]["document"]["familiars"][number]; busy: boolean; onConfigure(): void; onCommand(action: "complete" | "skip", stepId?: string): void }) {
  if (context.bootstrap.nextAction === "ConfigureFamiliar") return <section className="onboarding-card"><span className="onboarding-index">01</span><div><p className="eyebrow">Première rencontre</p><h2>Choisissez le compagnon qui vivra l’histoire avec vous.</h2><p>{familiar?.description ?? "Votre compagnon vous guidera sans décider à votre place."}</p></div><button className="button button--primary" onClick={onConfigure}>Créer mon compagnon</button></section>;
  const step = context.bootstrap.tutorial.steps.find((item) => !context.player.onboarding.completedStepIds.includes(item.id));
  if (!step) return null;
  return <section className="onboarding-card"><span className="onboarding-index">{String(step.order).padStart(2, "0")}</span><div><p className="eyebrow">Tutoriel persistant</p><h2>{step.title}</h2><p>{step.body}</p></div><button className="button button--primary" disabled={busy} onClick={() => onCommand("complete", step.id)}>J’ai compris</button>{context.bootstrap.tutorial.allowSkip && <button className="text-button" disabled={busy} onClick={() => onCommand("skip")}>Passer le tutoriel</button>}</section>;
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) { return <label className="help-slider"><span>{label}<b>{value}/5</b></span><input type="range" min="0" max="5" value={value} onChange={(event) => onChange(Number(event.target.value))} /><small>Discret</small><small>Très présent</small></label>; }
async function read<T>(response: Response): Promise<T> { if (!response.ok) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; throw new Error(problem?.detail ?? "Connectez-vous pour retrouver votre univers."); } return response.json() as Promise<T>; }
function asMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur inattendue est survenue."; }
