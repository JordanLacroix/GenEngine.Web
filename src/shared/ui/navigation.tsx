"use client";

import { BookOpen, Compass, Feather, Menu, Settings2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublishedExperienceContract, UserContextContract } from "@/shared/api/contracts";
import { gameCopy } from "@/shared/lib/game-copy";

export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<UserContextContract>();
  const [experience, setExperience] = useState<PublishedExperienceContract>();

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/me", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<UserContextContract> : undefined)
      .then(setContext)
      .catch(() => undefined);
    void fetch("/api/experience", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<PublishedExperienceContract> : undefined)
      .then(setExperience)
      .catch(() => undefined);
    return () => controller.abort();
  }, [path]);

  const permissions = new Set(context?.access.permissions ?? []);
  const document = context?.experience.document ?? experience?.document;
  const links = [
    { href: "/", label: gameCopy(document, "nav.home", "Accueil"), icon: Compass },
    { href: "/library", label: gameCopy(document, "nav.library", "Bibliothèque"), icon: BookOpen },
    ...(permissions.has("session.play") ? [{ href: "/experience", label: gameCopy(document, "nav.experience", "Mon univers"), icon: Sparkles }] : []),
    ...(permissions.has("scenario.author") ? [{ href: "/studio", label: gameCopy(document, "nav.studio", "Studio"), icon: Feather }] : []),
    ...(permissions.has("config.read") ? [{ href: "/administration", label: gameCopy(document, "nav.administration", "Administration"), icon: Settings2 }] : []),
  ];
  const initials = context?.access.userName.split(/[\s._-]/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") ?? "";
  const gameName = document?.game.name ?? "GenEngine";

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label={`${gameName}, accueil`}>
        <span className="brand-mark" aria-hidden="true">G</span>
        <span>{gameName}</span>
      </Link>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-navigation">
        <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav id="main-navigation" className={open ? "main-nav is-open" : "main-nav"} aria-label="Navigation principale">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === href : path.startsWith(href);
          return <Link key={href} href={href as Route} className={active ? "nav-link is-active" : "nav-link"} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={16} aria-hidden="true" />{label}</Link>;
        })}
      </nav>
      {context
        ? <Link className="profile-button" href={"/experience" as Route} aria-label={`Ouvrir le profil de ${context.access.userName}`}>{initials}</Link>
        : <Link className="login-link" href={"/account" as Route}>Se connecter</Link>}
    </header>
  );
}
