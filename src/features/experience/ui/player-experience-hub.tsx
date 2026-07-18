"use client";

import { Check, Coins, Gem, LoaderCircle, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProblemDetailsContract, UserContextContract } from "@/shared/api/contracts";
import { gameCopy } from "@/shared/lib/game-copy";

export function PlayerExperienceHub() {
  const [context, setContext] = useState<UserContextContract>();
  const [form, setForm] = useState("");
  const [tone, setTone] = useState("");
  const [helpLevel, setHelpLevel] = useState(2);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string>();
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/me", { signal: controller.signal })
      .then((response) => read<UserContextContract>(response))
      .then((value) => {
        setContext(value);
        const familiar = value.experience.document.familiars.find((item) => item.id === value.player.familiar?.familiarId) ?? value.experience.document.familiars[0];
        setForm(value.player.familiar?.form ?? familiar?.form ?? "");
        setTone(value.player.familiar?.tone ?? familiar?.tone ?? "");
        setHelpLevel(value.player.familiar?.helpLevel ?? familiar?.helpLevel ?? 2);
      })
      .catch((error: unknown) => setMessage(asMessage(error)))
      .finally(() => setBusy(false));
    return () => controller.abort();
  }, []);
  async function saveFamiliar() {
    if (!context) return;
    const familiar = context.experience.document.familiars[0];
    if (!familiar) return;
    setBusy(true);
    try {
      const player = await read<UserContextContract["player"]>(await fetch("/api/player/familiar", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision: context.player.revision, selection: { familiarId: familiar.id, form, tone, writingStyle: familiar.writingStyle, accent: familiar.accent, helpLevel } }),
      }));
      setContext({ ...context, player }); setMessage(gameCopy(context.experience.document, "experience.familiar.saved", "Votre familier s’adaptera dès la prochaine scène."));
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }
  async function purchase(offerId: string) {
    if (!context) return;
    setBusy(true);
    try {
      const player = await read<UserContextContract["player"]>(await fetch("/api/shop/purchases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, idempotencyKey: crypto.randomUUID() }),
      }));
      setContext({ ...context, player }); setMessage(gameCopy(context.experience.document, "experience.shop.purchased", "Objet ajouté à votre collection."));
    } catch (error) { setMessage(asMessage(error)); } finally { setBusy(false); }
  }
  if (!context) return <div className="experience-loading">{busy && <LoaderCircle className="spin" />}<p>{message ?? "Connexion à votre univers…"}</p><a className="button button--primary" href="/studio">Se connecter</a></div>;
  const { document } = context.experience;
  const copy = (key: string, fallback: string) => gameCopy(document, key, fallback);
  const familiar = document.familiars[0];
  return <div className="experience-hub">
    {message && <p className="experience-message" role="status">{message}</p>}
    <section className="wallet-hero"><div><p className="eyebrow">{copy("experience.wallet.title", "Portefeuille")}</p><strong>{context.player.balance}</strong><span>{context.player.currencyIcon} {context.player.currencyName}</span></div><div className="wallet-history">{context.player.recentEntries.length === 0 ? <p>{copy("experience.wallet.empty", "Vos choix écriront ici les premières lignes de votre progression.")}</p> : context.player.recentEntries.slice(0, 3).map((entry) => <p key={entry.id}><span>{entry.reason}</span><b className={entry.amount > 0 ? "positive" : ""}>{entry.amount > 0 ? "+" : ""}{entry.amount}</b></p>)}</div></section>
    {familiar && <section className="familiar-studio">
      <div className="familiar-preview"><div className="familiar-aura" /><span>✦</span><strong>{familiar.name}</strong><small>{tone} · aide {helpLevel}/5</small></div>
      <div className="familiar-controls"><p className="eyebrow">{copy("experience.familiar.configuration", "Configuration personnelle")}</p><h2>{copy("experience.familiar.subtitle", "Une présence qui vous ressemble")}</h2><p>{familiar.description}</p>
        <fieldset><legend>{copy("experience.familiar.form", "Forme")}</legend><div className="segmented">{familiar.availableForms.map((value) => <button key={value} className={form === value ? "is-selected" : ""} onClick={() => setForm(value)}>{form === value && <Check />}{value}</button>)}</div></fieldset>
        <fieldset><legend>{copy("experience.familiar.tone", "Ton")}</legend><div className="segmented">{familiar.availableTones.map((value) => <button key={value} className={tone === value ? "is-selected" : ""} onClick={() => setTone(value)}>{value}</button>)}</div></fieldset>
        <label className="help-slider"><span>{copy("experience.familiar.helpLevel", "Niveau d’aide")} <b>{helpLevel}/5</b></span><input type="range" min="0" max="5" value={helpLevel} onChange={(event) => setHelpLevel(Number(event.target.value))} /><small>{copy("experience.familiar.helpLow", "Discret")}</small><small>{copy("experience.familiar.helpHigh", "Très présent")}</small></label>
        <button className="button button--primary" disabled={busy} onClick={saveFamiliar}><Sparkles /> {copy("experience.familiar.apply", "Appliquer cette personnalité")}</button>
      </div>
    </section>}
    <section className="shop-section"><header><div><p className="eyebrow">{copy("experience.shop.title", "Magasin")}</p><h2>{copy("experience.shop.subtitle", "Des objets qui racontent qui vous êtes")}</h2></div><span><Coins /> {context.player.balance} {context.player.currencyCode}</span></header><div className="shop-grid">{document.economy.offers.filter((offer) => offer.enabled).map((offer) => {
      const owned = context.player.ownedOfferIds.includes(offer.id);
      return <article key={offer.id}><div className="shop-art">{offer.rewardType === "FamiliarCosmetic" ? <Gem /> : <ShoppingBag />}</div><p className="eyebrow">{offer.rewardType}</p><h3>{offer.name}</h3><p>{offer.description}</p><button className={owned ? "button button--quiet" : "button button--primary"} disabled={busy || owned || context.player.balance < offer.price} onClick={() => purchase(offer.id)}>{owned ? <><Check /> {copy("experience.shop.owned", "Acquis")}</> : <>{offer.price} {context.player.currencyIcon}</>}</button></article>;
    })}</div></section>
  </div>;
}

async function read<T>(response: Response): Promise<T> { if (!response.ok) { const problem = await response.json().catch(() => undefined) as ProblemDetailsContract | undefined; throw new Error(problem?.detail ?? "Connectez-vous pour retrouver votre univers."); } return response.json() as Promise<T>; }
function asMessage(error: unknown) { return error instanceof Error ? error.message : "Une erreur inattendue est survenue."; }
