"use client";

import { LogIn, Menu, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AudioToggle } from "@/shared/ui/audio-toggle";
import { buildNavigationLinks, hasOwnNavigation, isActiveLink } from "@/shared/ui/navigation-model";
import { initialsOf, useNavigationContext } from "@/shared/ui/use-navigation-context";

/**
 * En-tête global — pastille HUD flottante, barre basse sous 900 px.
 *
 * Il ne s'affiche pas sur les routes qui portent déjà leur navigation : la
 * double navigation constatée sur `/experience`, `/play`, `/studio` et
 * `/administration` venait de ce cumul. Le masquage est décidé ici, pas par
 * une règle CSS `:has()` qui ne couvrait pas les états de chargement.
 */
export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { document, permissions, authenticated, userName, gameName } = useNavigationContext();

  if (hasOwnNavigation(path)) return null;

  const links = buildNavigationLinks({ document, permissions, authenticated });

  return (
    <header className="site-header">
      <Link className="brand" href={"/plateforme" as Route} aria-label={`${gameName}, présentation de la plateforme`}>
        <span className="brand-mark" aria-hidden="true">G</span>
        <span>{gameName}</span>
      </Link>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-navigation">
        <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav id="main-navigation" className={open ? "main-nav is-open" : "main-nav"} aria-label="Navigation principale">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActiveLink(path, href);
          return <Link key={href} href={href as Route} className={active ? "nav-link is-active" : "nav-link"} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
            <Icon size={16} aria-hidden="true" />{label}
          </Link>;
        })}
      </nav>
      <div className="header-tools">
        <AudioToggle />
        {authenticated
          ? <Link className="profile-button" href={"/experience" as Route} aria-label={`Ouvrir le profil de ${userName ?? "votre compte"}`}>{initialsOf(userName)}</Link>
          : <Link className="login-link" href={"/" as Route}><LogIn size={14} aria-hidden="true" /> Se connecter</Link>}
      </div>
    </header>
  );
}
