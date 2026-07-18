"use client";

import { ArrowRight, BookOpen, LogIn, Play, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function authenticate() {
    setBusy(true); setError(undefined);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, userName, password }),
      });
      if (!response.ok) {
        const problem = await response.json().catch(() => undefined) as { detail?: string };
        throw new Error(problem?.detail ?? "Connexion impossible.");
      }
      window.location.assign("/experience?begin=1");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion impossible.");
    } finally { setBusy(false); }
  }

  return <div className="account-stage">
    <div className="account-illustration" aria-hidden="true" />
    <div className="account-gate page-shell">
      <section className="account-story">
        <p className="eyebrow eyebrow--accent"><Sparkles /> Le seuil de votre histoire</p>
        <h1>Une porte.<br />Puis toutes les autres.</h1>
        <p>Connectez-vous pour créer votre familier, vivre le prologue et gagner la clé qui ouvre votre première aventure.</p>
        <div><ShieldCheck /><span><strong>Votre progression reste à vous</strong><small>Le serveur garde les sessions ; le navigateur ne conserve aucun état narratif autoritatif.</small></span></div>
        <Link className="intro-replay-link" href="/?intro=1"><BookOpen /> Revoir l’introduction</Link>
      </section>
      <section className="account-form">
      <LogIn /><p className="eyebrow">{mode === "login" ? "Bon retour" : "Premier voyage"}</p>
      <h2>{mode === "login" ? "Se connecter" : "Créer votre compte"}</h2>
      {error && <p className="player-error-inline" role="alert">{error}</p>}
      <label>Identifiant<input autoComplete="username" value={userName} onChange={(event) => setUserName(event.target.value)} /></label>
      <label>Mot de passe<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button className="button button--primary" disabled={busy || !userName || !password} onClick={authenticate}>{mode === "login" ? "Entrer dans mon univers" : "Commencer mon aventure"}<ArrowRight /></button>
      <button className="text-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Je n’ai pas encore de compte" : "J’ai déjà un compte"}</button>
      <a className="button button--quiet microsoft-button" href="/api/auth/entra/start"><span>▦</span> Continuer avec Microsoft</a>
      <div className="demo-launch"><span><Play /><strong>Pas encore prêt ?</strong></span><p>Vivez un scénario complet, voyez votre chemin et vos gains, sans créer de compte.</p><Link className="button button--quiet" href="/play/demo">Lancer la démo illustrée <ArrowRight /></Link></div>
      </section>
    </div>
  </div>;
}
