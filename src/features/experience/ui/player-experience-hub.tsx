"use client";

import {
  BookHeart, CircleHelp, Coins, DoorOpen, Gem, KeyRound, LoaderCircle,
  LogOut, Map, ShoppingBag, Sparkles, Upload, UserRound, X,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import type {
  JournalContract, OnboardingStateContract, PlayerBootstrapContract, ProblemDetailsContract,
  UserContextContract,
} from "@/shared/api/contracts";
import type { StorySummary } from "@/entities/story/model/story";
import { gameCopy } from "@/shared/lib/game-copy";
import {
  parseFamiliarAssetPack, readFamiliarAssetPack, saveFamiliarAssetPack,
  type FamiliarAssetPack,
} from "@/features/experience/model/familiar-assets";
import {
  doorAnchorForIndex, journalTypeLabel, projectMapPoint, uniqueJournalEntries, uniqueMasteries,
  worldMapSize,
} from "@/features/experience/model/player-experience-presentation";
import { buildPlaces, isCatalogUnclassified } from "@/features/experience/model/map-places";
import type { FamiliarSelection } from "@/features/experience/model/familiar-preview";
import { FamiliarConfigurator, FamiliarPreviewPane } from "@/features/experience/ui/familiar-configurator";
import { PlaceOverlay } from "@/features/experience/ui/place-overlay";
import { useInstanceMedia } from "@/shared/assets/instance-media";
import { useAmbience, useAudio } from "@/shared/audio/audio-provider";
import { useFeedback } from "@/shared/ui/feedback-provider";

type Tab = "map" | "journal" | "companion" | "shop" | "help" | "account";
type Story = StorySummary;
type Context = UserContextContract & { bootstrap: PlayerBootstrapContract };
type Familiar = Context["experience"]["document"]["familiars"][number];

export function PlayerExperienceHub() {
  const feedback = useFeedback();
  useAmbience("ambience.map");
  const mapMedia = useInstanceMedia("map");
  const { setAmbienceUrl } = useAudio();
  // L'ambiance assignée par l'opérateur remplace le signal par défaut tant que
  // la carte est montée. Elle reste soumise au réglage sonore et à
  // `prefers-reduced-motion`, appliqués dans le fournisseur.
  useEffect(() => {
    setAmbienceUrl(mapMedia.ambienceUrl);
    return () => setAmbienceUrl(undefined);
  }, [mapMedia.ambienceUrl, setAmbienceUrl]);
  const [context, setContext] = useState<Context>();
  const [stories, setStories] = useState<Story[]>([]);
  const [journal, setJournal] = useState<JournalContract>();
  const [tab, setTab] = useState<Tab>("map");
  const [selection, setSelection] = useState<FamiliarSelection>({
    familiarId: "", form: "", tone: "", writingStyle: "", accent: "",
    helpLevel: 2, interventionFrequency: 2, proactive: true, customName: "",
  });
  const [openPlaceId, setOpenPlaceId] = useState<string>();
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
  const places = useMemo(
    () => buildPlaces(categories, stories, context?.player.masteries ?? []),
    [categories, context?.player.masteries, stories],
  );
  const unclassified = useMemo(() => isCatalogUnclassified(categories, stories), [categories, stories]);
  const openPlace = places.find((place) => place.id === openPlaceId);

  function patchSelection(patch: Partial<FamiliarSelection>) {
    setSelection((current) => ({ ...current, ...patch }));
  }

  function hydrateFamiliar(value: Context, preferredId?: string) {
    const definitions = value.experience.document.familiars;
    const selectedId = preferredId ?? value.player.familiar?.familiarId ?? value.player.familiarDefinition?.id ?? definitions[0]?.id ?? "";
    const definition = definitions.find((item) => item.id === selectedId) ?? definitions[0];
    if (!definition) return;
    const saved = value.player.familiar?.familiarId === definition.id ? value.player.familiar : undefined;
    setSelection({
      familiarId: definition.id,
      form: saved?.form ?? definition.form,
      tone: saved?.tone ?? definition.tone,
      writingStyle: saved?.writingStyle ?? definition.writingStyle,
      accent: saved?.accent ?? definition.accent,
      helpLevel: saved?.helpLevel ?? definition.helpLevel,
      interventionFrequency: value.player.familiar?.interventionFrequency ?? value.bootstrap.assistant.defaultFrequency,
      proactive: value.player.familiar?.proactive ?? value.bootstrap.assistant.proactive,
      customName: saved?.customName ?? definition.name,
    });
  }

  async function saveFamiliar() {
    if (!context) return;
    const familiar = context.experience.document.familiars.find((item) => item.id === selection.familiarId);
    if (!familiar || !selection.customName.trim()) { feedback.fail("Choisissez un familier et donnez-lui un nom."); return; }
    await run(async () => {
      // Chaque champ du modèle est envoyé depuis l'état réglé, y compris le style
      // d'écriture et l'accent qui étaient auparavant recopiés de la définition.
      await read<Context["player"]>(await fetch("/api/player/familiar", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision: context.player.revision, selection: {
          ...selection, familiarId: familiar.id, customName: selection.customName.trim(),
        } }),
      }));
      const refreshed = await read<Context>(await fetch("/api/me"));
      setContext(refreshed); hydrateFamiliar(refreshed);
      feedback.succeed(`Les réglages de ${selection.customName.trim()} sont enregistrés.`);
    });
  }

  async function importAssetPack(file?: File) {
    if (!file) return;
    try {
      if (file.size > 128_000) throw new Error("Le manifeste dépasse 128 Ko.");
      const pack = parseFamiliarAssetPack(await file.text());
      saveFamiliarAssetPack(pack); setAssetPack(pack); feedback.succeed(`Pack visuel « ${pack.name} » chargé localement.`);
    } catch (error) { feedback.fail(asMessage(error)); }
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
      feedback.succeed("Objet ajouté à votre collection.");
    });
  }

  async function signOut() {
    const confirmed = await feedback.confirm({
      title: "Se déconnecter ?",
      body: "Votre progression reste sur le serveur. Il faudra vous reconnecter pour retrouver votre univers.",
      confirmLabel: "Se déconnecter",
    });
    if (!confirmed) return;
    await fetch("/api/auth", { method: "DELETE" });
    window.location.assign("/");
  }
  async function resetOnboarding() {
    const confirmed = await feedback.confirm({
      title: "Recommencer le tutoriel ?",
      body: "Le prologue repart à sa première étape. La clé des passages devra être regagnée.",
      confirmLabel: "Recommencer le prologue",
      destructive: true,
    });
    if (confirmed) await onboarding("reset");
  }
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage(undefined);
    try { await action(); } catch (error) { setMessage(asMessage(error)); feedback.fail(asMessage(error)); }
    finally { setBusy(false); }
  }

  // Aucune sortie vers la démonstration ici : cet écran n'est atteint qu'avec une
  // session ouverte, et la démonstration ne s'adresse qu'aux visiteurs anonymes.
  if (!context) return <div className="experience-loading">{busy && <LoaderCircle className="spin" />}<p>{message ?? "Connexion à votre univers…"}</p>{!busy && <Link className="button button--quiet" href={"/" as Route}>Retourner au seuil</Link>}</div>;

  const document = context.experience.document;
  const copy = (key: string, fallback: string) => gameCopy(document, key, fallback);
  const familiar = document.familiars.find((item) => item.id === selection.familiarId) ?? document.familiars[0];
  // Un pack importé localement ne s'applique qu'au familier qu'il vise.
  const usesPack = familiar ? !assetPack.targetFamiliarId || assetPack.targetFamiliarId === familiar.id : false;
  const packOverrides = usesPack ? { portraitUrl: assetPack.portraitUrl, backgroundUrl: assetPack.backgroundUrl } : undefined;
  const hasKey = context.player.onboarding.status === "Completed";
  const journalEntries = uniqueJournalEntries(journal?.items ?? context.player.recentJournal);
  const masteries = uniqueMasteries(context.player.masteries);

  if (context.bootstrap.nextAction === "ConfigureFamiliar") {
    return <FirstFamiliar
      definitions={document.familiars} familiar={familiar} selection={selection} assetPack={assetPack}
      overrides={packOverrides} busy={busy} message={message}
      onSelect={(id) => hydrateFamiliar(context, id)} onChange={patchSelection}
      onImport={importAssetPack} onSave={saveFamiliar}
    />;
  }

  if (context.bootstrap.nextAction === "ResumeOnboarding") {
    const step = [...context.bootstrap.tutorial.steps]
      .sort((left, right) => left.order - right.order)
      .find((item) => !context.player.onboarding.completedStepIds.includes(item.id));
    if (step) return <TutorialStory
      step={step} current={context.player.onboarding.completedStepIds.length + 1}
      total={context.bootstrap.tutorial.steps.length} familiarName={selection.customName || familiar?.name || "Votre familier"}
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
    <div className="game-brand-hud"><Link href={"/plateforme" as Route} aria-label="Quitter l’univers et revenir à la présentation de la plateforme"><span>G</span><strong>{document.game.name}</strong></Link><small>Monde vivant · progression synchronisée</small></div>
    {message && <p className="experience-message" role="status">{message}</p>}
    {showsKeyReward && <KeyReward onClose={() => setShowsKeyReward(false)} />}
    <div className="universe-status"><span><KeyRound /> {hasKey ? "Clé des passages" : "Clé à gagner"}</span><strong>{context.player.balance} {context.player.currencyIcon}</strong></div>
    {familiar && <button className="companion-hud" type="button" onClick={() => setTab("companion")}><img src={(usesPack ? assetPack.portraitUrl : familiar.avatarUrl ?? familiar.portraitUrl) ?? "/illustrations/familiar-aster.jpg"} alt="" /><span><small>Compagnon</small><strong>{selection.customName || familiar.name}</strong></span><Sparkles aria-hidden="true" /></button>}
    <nav className="universe-tabs" aria-label="Votre univers">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon />{label}</button>)}</nav>

    {tab === "map" && <section className="universe-panel world-map world-map--illustrated">
      <header><div><p className="eyebrow">La carte des passages</p><h2>Choisissez une porte</h2><p>{hasKey ? "Votre clé ouvre toutes les catégories." : "Le prologue a été passé : terminez-le depuis votre compte pour gagner la clé."} Chaque histoire reste libre de raconter ses propres règles.</p></div></header>
      <div className="door-map" ref={setMapElement} style={{ backgroundImage: `url(${mapMedia.backgroundUrl ?? "/illustrations/world-map.jpg"})` }}>
        {places.map((place, index) => {
          const position = projectMapPoint(doorAnchorForIndex(index, mapSize), mapSize);
          return <button
            key={place.id}
            className={openPlaceId === place.id ? "world-door is-selected" : "world-door"}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            aria-haspopup="dialog"
            aria-expanded={openPlaceId === place.id}
            onClick={() => setOpenPlaceId(place.id)}
          >
            <span className="door-arch"><DoorOpen aria-hidden="true" /></span>
            <strong>{place.name}</strong>
            <small>{place.scenarios.length} récit{place.scenarios.length > 1 ? "s" : ""} · {place.progressPercent}%</small>
          </button>;
        })}
      </div>
      {places.length === 0 && <p className="map-empty" role="status">
        Aucune catégorie n’est publiée pour cette expérience. La carte reste vide tant qu’une
        personne administratrice n’en a pas déclaré depuis l’interface de configuration.
      </p>}
      {openPlace && <PlaceOverlay place={openPlace} unclassified={unclassified} onClose={() => setOpenPlaceId(undefined)} />}
    </section>}

    {tab === "journal" && <section className="universe-panel journal-panel game-overlay"><OverlayClose onClose={() => setTab("map")} /><header><div><p className="eyebrow">Votre parcours</p><h2>Le journal de vos choix</h2></div><strong>{journalEntries.length} trace{journalEntries.length > 1 ? "s" : ""}</strong></header><div className="journal-layout"><div>{journalEntries.map((entry) => <article key={entry.id}><time>{new Date(entry.occurredAt).toLocaleDateString("fr-FR")}</time><span /><div><p className="eyebrow">{journalTypeLabel(entry.type)}</p><h3>{entry.title}</h3><p>{entry.summary}</p></div></article>)}</div><aside><h3>Maîtrise des histoires</h3>{masteries.map((mastery) => <div key={mastery.scenarioVersionId}><span>{mastery.endingIds.length} fin(s) · {mastery.choiceIds.length} choix</span><b>{mastery.masteryPercent}%</b><div className="progress-track"><span style={{ width: `${mastery.masteryPercent}%` }} /></div></div>)}</aside></div></section>}

    {tab === "companion" && familiar && <section className="familiar-studio game-overlay">
      <OverlayClose onClose={() => setTab("map")} />
      <FamiliarPreviewPane selection={selection} definition={familiar} overrides={packOverrides} />
      <div className="familiar-controls">
        <p className="eyebrow">Configuration personnelle</p>
        <h2>Une présence vraiment à vous</h2>
        <p>{familiar.description}</p>
        <FamiliarConfigurator definitions={document.familiars} definition={familiar} selection={selection} overrides={packOverrides} onChange={patchSelection} onSelectFamiliar={(id) => hydrateFamiliar(context, id)} />
        <AssetPackImport assetPack={assetPack} onImport={importAssetPack} />
        <button className="button button--primary companion-save" disabled={busy || !selection.customName.trim()} onClick={saveFamiliar}><Sparkles aria-hidden="true" /> Enregistrer les réglages</button>
      </div>
    </section>}

    {tab === "shop" && <section className="universe-panel shop-section"><header><div><p className="eyebrow">Magasin</p><h2>Des objets gagnés par vos choix</h2></div><span><Coins /> {context.player.balance} {context.player.currencyCode}</span></header><div className="shop-grid">{document.economy.offers.filter((offer) => offer.enabled).map((offer) => { const owned = context.player.ownedOfferIds.includes(offer.id); return <article key={offer.id}><div className="shop-art">{offer.rewardType === "FamiliarCosmetic" ? <Gem /> : <ShoppingBag />}</div><h3>{offer.name}</h3><p>{offer.description}</p><button className={owned ? "button button--quiet" : "button button--primary"} disabled={busy || owned || context.player.balance < offer.price} onClick={() => purchase(offer.id)}>{owned ? "Acquis" : `${offer.price} ${context.player.currencyIcon}`}</button></article>; })}</div></section>}

    {tab === "help" && <section className="universe-panel help-center"><header><p className="eyebrow">Centre d’aide</p><h2>Comprendre sans quitter l’aventure</h2></header><div>{document.help.articles.filter((article) => article.published).map((article) => <details key={article.id}><summary><CircleHelp /><span><strong>{article.title}</strong><small>{article.summary}</small></span></summary><p>{article.body}</p></details>)}</div><aside><h3>Glossaire du monde</h3>{document.help.glossary.map((entry) => <p key={entry.term}><strong>{entry.term}</strong>{entry.definition}</p>)}</aside></section>}

    {tab === "account" && <section className="universe-panel account-panel"><UserRound /><p className="eyebrow">Compte joueur</p><h2>{context.access.userName}</h2><p>Vos sessions, votre tutoriel et votre journal sont synchronisés avec votre compte.</p><Link className="button button--quiet" href={"/plateforme?intro=1" as Route}>Revoir l’introduction</Link><button className="button button--quiet" onClick={() => void resetOnboarding()}>Recommencer le tutoriel</button><button className="button button--primary" onClick={signOut}><LogOut /> Se déconnecter</button></section>}
  </div>;
}

function FirstFamiliar(props: {
  definitions: Familiar[]; familiar?: Familiar; selection: FamiliarSelection; assetPack: FamiliarAssetPack;
  overrides?: { portraitUrl?: string; backgroundUrl?: string }; busy: boolean; message?: string;
  onSelect(id: string): void; onChange(patch: Partial<FamiliarSelection>): void;
  onImport(file?: File): void; onSave(): void;
}) {
  if (!props.familiar) return <div className="experience-loading"><p>Aucun familier n’est publié pour cette expérience.</p></div>;
  return <section className="first-familiar">
    <FamiliarPreviewPane selection={props.selection} definition={props.familiar} overrides={props.overrides} />
    <div className="familiar-controls">
      <p className="eyebrow">Chapitre I · La rencontre</p>
      <h1>Qui franchira le seuil avec vous ?</h1>
      <p>Chaque réglage se voit et s’entend dans l’aperçu, avant d’être enregistré. Rien ici ne vous appartient comme un objet : le pack ne fournit que des illustrations ouvertes.</p>
      {props.message && <p className="experience-message">{props.message}</p>}
      <FamiliarConfigurator definitions={props.definitions} definition={props.familiar} selection={props.selection} overrides={props.overrides} onChange={props.onChange} onSelectFamiliar={props.onSelect} />
      <AssetPackImport assetPack={props.assetPack} onImport={props.onImport} />
      <button className="button button--primary" disabled={props.busy || !props.selection.customName.trim()} onClick={props.onSave}>Commencer notre histoire <DoorOpen aria-hidden="true" /></button>
    </div>
  </section>;
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

async function read<T>(response: Response): Promise<T> { if (!response.ok) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; throw new Error(problem?.detail ?? "Connectez-vous pour retrouver votre univers."); } return response.json() as Promise<T>; }
function asMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur inattendue est survenue."; }
