"use client";

import { ArrowRight, LogIn, ShieldCheck, Sparkles } from "lucide-react";
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
      window.location.assign("/experience");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion impossible.");
    } finally { setBusy(false); }
  }

  return <div className="account-gate page-shell">
    <section className="account-story">
      <p className="eyebrow eyebrow--accent"><Sparkles /> Votre histoire vous attend</p>
      <h1>Retrouvez les chemins<br />qui n’appartiennent qu’à vous.</h1>
      <p>Votre progression, votre journal et votre compagnon restent synchronisés sur tous vos appareils.</p>
      <div><ShieldCheck /><span><strong>Session protégée</strong><small>Le jeton reste dans un cookie sécurisé.</small></span></div>
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
      <span className="account-demo">ou <Link href="/play/demo">essayer le scénario démo sans compte</Link></span>
    </section>
  </div>;
}
