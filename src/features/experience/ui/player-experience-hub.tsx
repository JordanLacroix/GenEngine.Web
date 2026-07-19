"use client";

import {
  BookHeart, Check, CircleHelp, Coins, DoorOpen, Gem, KeyRound, LoaderCircle,
  LogOut, Map, Search, ShoppingBag, Sparkles, Upload, UserRound, X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  JournalContract, OnboardingStateContract, PlayerBootstrapContract, ProblemDetailsContract,
  UserContextContract,
} from "@/shared/api/contracts";
import { gameCopy } from "@/shared/lib/game-copy";
import {
  parseFamiliarAssetPack, readFamiliarAssetPack, saveFamiliarAssetPack,
  type FamiliarAssetPack,
} from "@/features/experience/model/familiar-assets";
import {
  doorAnchorsForViewport, familiarOptionLabel, journalTypeLabel, projectMapPoint, uniqueJournalEntries, uniqueMasteries,
  worldMapSize,
} from "@/features/experience/model/player-experience-presentation";

type Tab = "map" | "journal" | "companion" | "shop" | "help" | "account";
type Story = { id: string; slug: string; title: string; synopsis: string; durationMinutes: number; scenarioVersionId: string };
type Context = UserContextContract & { bootstrap: PlayerBootstrapContract };
type Familiar = Context["experience"]["document"]["familiars"][number];

export function PlayerExperienceHub() {
  const [context, setContext] = useState<Context>();
  const [stories, setStories] = useState<Story[]>([]);
  const [journal, setJournal] = useState<JournalContract>();
  const [tab, setTab] = useState<Tab>("map");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [familiarId, setFamiliarId] = useState("");
  const [form, setForm] = useState("");
  const [tone, setTone] = useState("");
  const [customName, setCustomName] = useState("");
  const [helpLevel, setHelpLevel] = useState(2);
  const [frequency, setFrequency] = useState(2);
  const [proactive, setProactive] = useState(true);
  const [assetPack, setAssetPack] = useState<FamiliarAssetPack>(() => readFamiliarAssetPack());
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>(worldMapSize);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string>();
  const [showsKeyReward, setShowsKeyReward] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/me", { signal: controller.signal }).then((response) => read<Context>(response)),
      fetch("/api/catalog", { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<Story[]> : []),
      fetch("/api/player/journal", { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<JournalContract> : undefined),
    ]).then(([value, catalog, timeline]) => {
      setContext(value); setStories(catalog); setJournal(timeline); hydrateFamiliar(value);
      setSelectedCategory(value.experience.document.categories.find((item) => item.isVisible)?.id);
    }).catch((error: unknown) => setMessage(asMessage(error))).finally(() => setBusy(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!mapElement) return;
    const update = () => setMapSize({ width: mapElement.clientWidth, height: mapElement.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(mapElement);
    return () => observer.disconnect();
  }, [mapElement]);

  const categories = useMemo(() => context?.experience.document.categories.filter((item) => item.isVisible) ?? [], [context]);
  const filteredStories = useMemo(() => stories.filter((story) => {
    const matchesQuery = `${story.title} ${story.synopsis}`.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    const category = categories.find((item) => item.id === selectedCategory);
    return matchesQuery && (!category || category.scenarioIds.length === 0 || category.scenarioIds.includes(story.id));
  }), [categories, query, selectedCategory, stories]);

  function hydrateFamiliar(value: Context, preferredId?: string) {
    const definitions = value.experience.document.familiars;
    const selectedId = preferredId ?? value.player.familiar?.familiarId ?? value.player.familiarDefinition?.id ?? definitions[0]?.id ?? "";
    const definition = definitions.find((item) => item.id === selectedId) ?? definitions[0];
    if (!definition) return;
    setFamiliarId(definition.id);
    setForm(value.player.familiar?.familiarId === definition.id ? value.player.familiar.form : definition.form);
    setTone(value.player.familiar?.familiarId === definition.id ? value.player.familiar.tone : definition.tone);
    setCustomName(value.player.familiar?.familiarId === definition.id ? value.player.familiar.customName ?? definition.name : definition.name);
    setHelpLevel(value.player.familiar?.familiarId === definition.id ? value.player.familiar.helpLevel : definition.helpLevel);
    setFrequency(value.player.familiar?.interventionFrequency ?? value.bootstrap.assistant.defaultFrequency);
    setProactive(value.player.familiar?.proactive ?? value.bootstrap.assistant.proactive);
  }

  async function saveFamiliar() {
    if (!context) return;
    const familiar = context.experience.document.familiars.find((item) => item.id === familiarId);
    if (!familiar || !customName.trim()) { setMessage("Choisissez un familier et donnez-lui un nom."); return; }
    await run(async () => {
      await read<Context["player"]>(await fetch("/api/player/familiar", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision: context.player.revision, selection: {
          familiarId: familiar.id, form, tone, customName: customName.trim(), writingStyle: familiar.writingStyle,
          accent: familiar.accent, helpLevel, interventionFrequency: frequency, proactive,
        } }),
      }));
      const refreshed = await read<Context>(await fetch("/api/me"));
      setContext(refreshed); hydrateFamiliar(refreshed);
      setMessage(`Les réglages de ${customName.trim()} sont enregistrés.`);
    });
  }

  async function importAssetPack(file?: File) {
    if (!file) return;
    try {
      if (file.size > 128_000) throw new Error("Le manifeste dépasse 128 Ko.");
      const pack = parseFamiliarAssetPack(await file.text());
      saveFamiliarAssetPack(pack); setAssetPack(pack); setMessage(`Pack visuel « ${pack.name} » chargé localement.`);
    } catch (error) { setMessage(asMessage(error)); }
  }

  async function onboarding(action: "complete" | "skip" | "reset", stepId?: string) {
    if (!context) return;
    await run(async () => {
      const state = await read<OnboardingStateContract>(await fetch("/api/player/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, stepId, idempotencyKey: crypto.randomUUID() }),
      }));
      const refreshed = await read<Context>(await fetch("/api/me"));
      setContext(refreshed);
      if (state.status === "Completed") setShowsKeyReward(true);
    });
  }

  async function purchase(offerId: string) {
    if (!context) return;
    await run(async () => {
      const player = await read<Context["player"]>(await fetch("/api/shop/purchases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, idempotencyKey: crypto.randomUUID() }),
      }));
      setContext({ ...context, player, bootstrap: { ...context.bootstrap, experience: player } });
      setMessage("Objet ajouté à votre collection.");
    });
  }

  async function signOut() { await fetch("/api/auth", { method: "DELETE" }); window.location.assign("/account"); }
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage(undefined);
    try { await action(); } catch (error) { setMessage(asMessage(error)); }
    finally { setBusy(false); }
  }

  if (!context) return <div className="experience-loading">{busy && <LoaderCircle className="spin" />}<p>{message ?? "Connexion à votre univers…"}</p><Link className="button button--primary" href="/play/demo">Accéder au mode démo</Link></div>;

  const document = context.experience.document;
  const copy = (key: string, fallback: string) => gameCopy(document, key, fallback);
  const familiar = document.familiars.find((item) => item.id === familiarId) ?? document.familiars[0];
  const hasKey = context.player.onboarding.status === "Completed";
  const journalEntries = uniqueJournalEntries(journal?.items ?? context.player.recentJournal);
  const masteries = uniqueMasteries(context.player.masteries);

  if (context.bootstrap.nextAction === "ConfigureFamiliar") {
    return <FirstFamiliar
      definitions={document.familiars} familiar={familiar} familiarId={familiarId} form={form} tone={tone}
      customName={customName} helpLevel={helpLevel} frequency={frequency} proactive={proactive} assetPack={assetPack}
      busy={busy} message={message} onSelect={(id) => hydrateFamiliar(context, id)} onForm={setForm} onTone={setTone}
      onName={setCustomName} onHelpLevel={setHelpLevel} onFrequency={setFrequency} onProactive={setProactive}
      onImport={importAssetPack} onSave={saveFamiliar}
    />;
  }

  if (context.bootstrap.nextAction === "ResumeOnboarding") {
    const step = [...context.bootstrap.tutorial.steps]
      .sort((left, right) => left.order - right.order)
      .find((item) => !context.player.onboarding.completedStepIds.includes(item.id));
    if (step) return <TutorialStory
      step={step} current={context.player.onboarding.completedStepIds.length + 1}
      total={context.bootstrap.tutorial.steps.length} familiarName={customName || familiar?.name || "Votre familier"}
      busy={busy} allowSkip={context.bootstrap.tutorial.allowSkip}
      onComplete={() => onboarding("complete", step.id)} onSkip={() => onboarding("skip")}
    />;
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof Map }> = [
    { id: "map", label: copy("nav.map", "Carte"), icon: Map },
    { id: "journal", label: copy("nav.progress", "Journal"), icon: BookHeart },
    { id: "companion", label: copy("nav.companion", "Compagnon"), icon: Sparkles },
    { id: "shop", label: copy("nav.shop", "Magasin"), icon: ShoppingBag },
    { id: "help", label: copy("nav.help", "Aide"), icon: CircleHelp },
    { id: "account", label: copy("nav.account", "Compte"), icon: UserRound },
  ];

  return <div className="player-universe">
    <div className="game-brand-hud"><Link href="/" aria-label="Quitter l’univers et revenir à l’accueil"><span>G</span><strong>{document.game.name}</strong></Link><small>Monde vivant · progression synchronisée</small></div>
    {message && <p className="experience-message" role="status">{message}</p>}
    {showsKeyReward && <KeyReward onClose={() => setShowsKeyReward(false)} />}
    <div className="universe-status"><span><KeyRound /> {hasKey ? "Clé des passages" : "Clé à gagner"}</span><strong>{context.player.balance} {context.player.currencyIcon}</strong></div>
    {familiar && <button className="companion-hud" type="button" onClick={() => setTab("companion")}><img src={((!assetPack.targetFamiliarId || assetPack.targetFamiliarId === familiar.id) ? assetPack.portraitUrl : familiar.avatarUrl ?? familiar.portraitUrl) ?? "/illustrations/familiar-aster.jpg"} alt="" /><span><small>Compagnon</small><strong>{customName || familiar.name}</strong></span><Sparkles /></button>}
    <nav className="universe-tabs" aria-label="Votre univers">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon />{label}</button>)}</nav>

    {tab === "map" && <section className="universe-panel world-map world-map--illustrated">
      <header><div><p className="eyebrow">La carte des passages</p><h2>Choisissez une porte</h2><p>{hasKey ? "Votre clé ouvre toutes les catégories." : "Le prologue a été passé : terminez-le depuis votre compte pour gagner la clé."} Chaque histoire reste libre de raconter ses propres règles.</p></div><label className="universe-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une histoire…" /></label></header>
      <div className="door-map" ref={setMapElement} style={{ backgroundImage: "url(/illustrations/world-map.jpg)" }}>
        {categories.map((category, index) => {
          const anchors = doorAnchorsForViewport(mapSize);
          const position = projectMapPoint(anchors[index % anchors.length]!, mapSize);
          const storiesInCategory = stories.filter((story) => category.scenarioIds.length === 0 || category.scenarioIds.includes(story.id));
          const mastery = context.player.masteries.filter((item) => category.scenarioIds.includes(item.scenarioId));
          const progress = mastery.length ? Math.round(mastery.reduce((sum, item) => sum + item.masteryPercent, 0) / mastery.length) : 0;
          return <button key={category.id} className={selectedCategory === category.id ? "world-door is-selected" : "world-door"} style={{ left: `${position.x}px`, top: `${position.y}px` }} onClick={() => setSelectedCategory(category.id)}>
            <span className="door-arch"><DoorOpen /></span><strong>{category.name}</strong><small>{storiesInCategory.length} récit(s) · {progress}%</small>
          </button>;
        })}
      </div>
      <div className="scenario-shelf">{filteredStories.map((story) => {
        const mastery = context.player.masteries.find((item) => item.scenarioVersionId === story.scenarioVersionId);
        return <article key={story.id}><p className="eyebrow">{story.durationMinutes} min</p><h3>{story.title}</h3><p>{story.synopsis}</p><div className="progress-track"><span style={{ width: `${mastery?.masteryPercent ?? 0}%` }} /></div><Link className="button button--primary" href={`/play/${story.scenarioVersionId}`}>{mastery ? "Reprendre ce chemin" : "Franchir la porte"}</Link><Link className="text-button" href={`/library/${story.scenarioVersionId}`}>Mémoire de mes parcours</Link></article>;
      })}</div>
    </section>}

    {tab === "journal" && <section className="universe-panel journal-panel game-overlay"><OverlayClose onClose={() => setTab("map")} /><header><div><p className="eyebrow">Votre parcours</p><h2>Le journal de vos choix</h2></div><strong>{journalEntries.length} trace{journalEntries.length > 1 ? "s" : ""}</strong></header><div className="journal-layout"><div>{journalEntries.map((entry) => <article key={entry.id}><time>{new Date(entry.occurredAt).toLocaleDateString("fr-FR")}</time><span /><div><p className="eyebrow">{journalTypeLabel(entry.type)}</p><h3>{entry.title}</h3><p>{entry.summary}</p></div></article>)}</div><aside><h3>Maîtrise des histoires</h3>{masteries.map((mastery) => <div key={mastery.scenarioVersionId}><span>{mastery.endingIds.length} fin(s) · {mastery.choiceIds.length} choix</span><b>{mastery.masteryPercent}%</b><div className="progress-track"><span style={{ width: `${mastery.masteryPercent}%` }} /></div></div>)}</aside></div></section>}

    {tab === "companion" && familiar && <section className="familiar-studio game-overlay"><OverlayClose onClose={() => setTab("map")} /><FamiliarPreview familiar={familiar} name={customName} tone={tone} helpLevel={helpLevel} assetPack={assetPack} /><div className="familiar-controls"><p className="eyebrow">Configuration personnelle</p><h2>Une présence vraiment à vous</h2><p>{familiar.description}</p><FamiliarFields definitions={document.familiars} familiarId={familiarId} familiar={familiar} form={form} tone={tone} customName={customName} helpLevel={helpLevel} frequency={frequency} proactive={proactive} onSelect={(id) => hydrateFamiliar(context, id)} onForm={setForm} onTone={setTone} onName={setCustomName} onHelpLevel={setHelpLevel} onFrequency={setFrequency} onProactive={setProactive} /><AssetPackImport assetPack={assetPack} onImport={importAssetPack} /><button className="button button--primary companion-save" disabled={busy || !customName.trim()} onClick={saveFamiliar}><Sparkles /> Enregistrer les réglages</button></div></section>}

    {tab === "shop" && <section className="universe-panel shop-section"><header><div><p className="eyebrow">Magasin</p><h2>Des objets gagnés par vos choix</h2></div><span><Coins /> {context.player.balance} {context.player.currencyCode}</span></header><div className="shop-grid">{document.economy.offers.filter((offer) => offer.enabled).map((offer) => { const owned = context.player.ownedOfferIds.includes(offer.id); return <article key={offer.id}><div className="shop-art">{offer.rewardType === "FamiliarCosmetic" ? <Gem /> : <ShoppingBag />}</div><h3>{offer.name}</h3><p>{offer.description}</p><button className={owned ? "button button--quiet" : "button button--primary"} disabled={busy || owned || context.player.balance < offer.price} onClick={() => purchase(offer.id)}>{owned ? "Acquis" : `${offer.price} ${context.player.currencyIcon}`}</button></article>; })}</div></section>}

    {tab === "help" && <section className="universe-panel help-center"><header><p className="eyebrow">Centre d’aide</p><h2>Comprendre sans quitter l’aventure</h2></header><div>{document.help.articles.filter((article) => article.published).map((article) => <details key={article.id}><summary><CircleHelp /><span><strong>{article.title}</strong><small>{article.summary}</small></span></summary><p>{article.body}</p></details>)}</div><aside><h3>Glossaire du monde</h3>{document.help.glossary.map((entry) => <p key={entry.term}><strong>{entry.term}</strong>{entry.definition}</p>)}</aside></section>}

    {tab === "account" && <section className="universe-panel account-panel"><UserRound /><p className="eyebrow">Compte joueur</p><h2>{context.access.userName}</h2><p>Vos sessions, votre tutoriel et votre journal sont synchronisés avec votre compte.</p><Link className="button button--quiet" href="/?intro=1">Revoir l’introduction</Link><button className="button button--quiet" onClick={() => onboarding("reset")}>Recommencer le tutoriel</button><button className="button button--primary" onClick={signOut}><LogOut /> Se déconnecter</button></section>}
  </div>;
}

function FirstFamiliar(props: {
  definitions: Familiar[]; familiar?: Familiar; familiarId: string; form: string; tone: string; customName: string;
  helpLevel: number; frequency: number; proactive: boolean; assetPack: FamiliarAssetPack; busy: boolean; message?: string;
  onSelect(id: string): void; onForm(value: string): void; onTone(value: string): void; onName(value: string): void;
  onHelpLevel(value: number): void; onFrequency(value: number): void; onProactive(value: boolean): void;
  onImport(file?: File): void; onSave(): void;
}) {
  if (!props.familiar) return <div className="experience-loading"><p>Aucun familier n’est publié pour cette expérience.</p></div>;
  return <section className="first-familiar"><FamiliarPreview familiar={props.familiar} name={props.customName} tone={props.tone} helpLevel={props.helpLevel} assetPack={props.assetPack} /><div className="familiar-controls"><p className="eyebrow">Chapitre I · La rencontre</p><h1>Qui franchira le seuil avec vous ?</h1><p>Choisissez une présence, nommez-la et réglez son aide. Rien ici ne vous appartient comme un objet : le pack ne fournit que des illustrations ouvertes.</p>{props.message && <p className="experience-message">{props.message}</p>}<FamiliarFields {...props} familiar={props.familiar} /><AssetPackImport assetPack={props.assetPack} onImport={props.onImport} /><button className="button button--primary" disabled={props.busy || !props.customName.trim()} onClick={props.onSave}>Commencer notre histoire <DoorOpen /></button></div></section>;
}

function FamiliarPreview({ familiar, name, tone, helpLevel, assetPack }: { familiar: Familiar; name: string; tone: string; helpLevel: number; assetPack: FamiliarAssetPack }) {
  const usesPack = !assetPack.targetFamiliarId || assetPack.targetFamiliarId === familiar.id;
  const portrait = usesPack ? assetPack.portraitUrl : familiar.portraitUrl ?? familiar.avatarUrl;
  const background = usesPack ? assetPack.backgroundUrl : familiar.backgroundUrl;
  return <div className="familiar-preview" style={background ? { backgroundImage: `linear-gradient(rgb(5 10 12 / 18%), rgb(5 10 12 / 82%)), url(${background})` } : undefined}>{portrait ? <img src={portrait} alt={name || familiar.name} /> : <span>✦</span>}<strong>{name || familiar.name}</strong><small>{familiarOptionLabel(tone)} · aide {helpLevel}/5</small></div>;
}

function FamiliarFields(props: {
  definitions: Familiar[]; familiar: Familiar; familiarId: string; form: string; tone: string; customName: string;
  helpLevel: number; frequency: number; proactive: boolean; onSelect(id: string): void; onForm(value: string): void;
  onTone(value: string): void; onName(value: string): void; onHelpLevel(value: number): void;
  onFrequency(value: number): void; onProactive(value: boolean): void;
}) {
  return <><fieldset><legend>Présence</legend><div className="segmented">{props.definitions.map((item) => <button type="button" key={item.id} className={props.familiarId === item.id ? "is-selected" : ""} onClick={() => props.onSelect(item.id)}>{props.familiarId === item.id && <Check />}{item.name}</button>)}</div></fieldset><label>Son nom<input value={props.customName} maxLength={80} onChange={(event) => props.onName(event.target.value)} /></label><fieldset><legend>Forme</legend><div className="segmented">{props.familiar.availableForms.map((value) => <button type="button" key={value} className={props.form === value ? "is-selected" : ""} onClick={() => props.onForm(value)}>{props.form === value && <Check />}{familiarOptionLabel(value)}</button>)}</div></fieldset><fieldset><legend>Personnalité</legend><div className="segmented">{props.familiar.availableTones.map((value) => <button type="button" key={value} className={props.tone === value ? "is-selected" : ""} onClick={() => props.onTone(value)}>{props.tone === value && <Check />}{familiarOptionLabel(value)}</button>)}</div></fieldset><Slider label="Niveau d’aide" value={props.helpLevel} onChange={props.onHelpLevel} /><Slider label="Fréquence d’intervention" value={props.frequency} onChange={props.onFrequency} /><label className="toggle-line"><input type="checkbox" checked={props.proactive} onChange={(event) => props.onProactive(event.target.checked)} /> Me proposer de l’aide au bon moment</label></>;
}

function OverlayClose({ onClose }: { onClose(): void }) {
  return <button className="game-overlay-close" type="button" onClick={onClose} aria-label="Fermer ce panneau et revenir à la carte" title="Retour à la carte"><X aria-hidden="true" /></button>;
}

function AssetPackImport({ assetPack, onImport }: { assetPack: FamiliarAssetPack; onImport(file?: File): void }) {
  return <div className="asset-pack"><div><Upload /><span><strong>Pack visuel : {assetPack.name}</strong><small>{assetPack.license} · {assetPack.attribution}</small></span></div><label className="button button--quiet">Charger un manifeste JSON<input type="file" accept="application/json,.json" onChange={(event) => onImport(event.target.files?.[0])} /></label></div>;
}

function TutorialStory({ step, current, total, familiarName, busy, allowSkip, onComplete, onSkip }: { step: Context["bootstrap"]["tutorial"]["steps"][number]; current: number; total: number; familiarName: string; busy: boolean; allowSkip: boolean; onComplete(): void; onSkip(): void }) {
  const interaction = interactionFor(step.action, step.target);
  return <section className="tutorial-story" style={{ backgroundImage: "linear-gradient(90deg, rgb(5 9 11 / 95%), rgb(5 9 11 / 38%)), url(/illustrations/intro-gateway.jpg)" }}><div className="tutorial-copy"><p className="eyebrow">Prologue · {current}/{total}</p><h1>{step.title}</h1><p>{step.body}</p><div className={`tutorial-interaction tutorial-interaction--${interaction.kind}`}><span>{interaction.icon}</span><div><strong>{interaction.title}</strong><small>{interaction.body}</small></div><button className="button button--primary" disabled={busy} onClick={onComplete}>{interaction.action}</button></div><p className="familiar-line"><Sparkles /> {familiarName} : « Chaque geste que vous faites ici peut être configuré par le scénario. »</p>{allowSkip && <button className="text-button" disabled={busy} onClick={onSkip}>Passer le prologue</button>}</div></section>;
}

function interactionFor(action: string, target: string) {
  const source = `${action} ${target}`.toLowerCase();
  if (source.includes("map") || source.includes("door")) return { kind: "door", icon: "⌁", title: "La porte réagit à votre présence", body: "Activez-la pour révéler la suite du dialogue.", action: "Ouvrir la porte" };
  if (source.includes("familiar") || source.includes("assistant")) return { kind: "familiar", icon: "✦", title: "Votre familier remarque un détail", body: "Touchez son éclat pour matérialiser son indice.", action: "Écouter l’indice" };
  return { kind: "rune", icon: "◇", title: "Un fragment de récit attend votre geste", body: "Cette interaction à l’écran valide l’étape et fait avancer le scénario.", action: "Activer le fragment" };
}

function KeyReward({ onClose }: { onClose(): void }) {
  return <div className="key-reward" role="dialog" aria-modal="true" aria-label="Clé des passages acquise"><div className="key-reward-art" /><div><p className="eyebrow">Prologue terminé</p><h2>Vous avez gagné la Clé des passages.</h2><p>Elle ouvre n’importe quelle porte de la carte. Votre chemin, vos choix et vos gains restent consultables dans le journal.</p><ul><li><KeyRound /> Clé universelle</li><li><BookHeart /> Chemin du prologue inscrit</li><li><Sparkles /> Familier prêt à intervenir</li></ul><button className="button button--primary" onClick={onClose}>Déployer la carte <Map /></button></div></div>;
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) { return <label className="help-slider"><span>{label}<b>{value}/5</b></span><input type="range" min="0" max="5" value={value} onChange={(event) => onChange(Number(event.target.value))} /><small>Discret</small><small>Très présent</small></label>; }
async function read<T>(response: Response): Promise<T> { if (!response.ok) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; throw new Error(problem?.detail ?? "Connectez-vous pour retrouver votre univers."); } return response.json() as Promise<T>; }
function asMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur inattendue est survenue."; }
