"use client";

import { LogIn, Menu, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AudioToggle } from "@/shared/ui/audio-toggle";
import { buildNavigationLinks, hasOwnNavigation, isActiveLink, primaryDestination } from "@/shared/ui/navigation-model";
import { initialsOf, useNavigationContext } from "@/shared/ui/use-navigation-context";
import { brandInitial } from "@/shared/ui/branding-theme";

/**
 * En-tête global — pastille HUD flottante, barre basse sous 900 px.
 *
 * Il ne s'affiche pas sur les routes qui portent déjà leur navigation : la
 * double navigation constatée sur `/experience`, `/play`, `/studio` et
 * `/administration` venait de ce cumul. Le masquage est décidé ici, pas par
 * une règle CSS `:has()` qui ne couvrait pas les états de chargement.
 */
export function Navigation({ applicationName }: { applicationName?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { document, permissions, authenticated, userName, gameName } = useNavigationContext();

  if (hasOwnNavigation(path)) return null;

  // Le nom vient du `branding` publié, résolu côté serveur par la coque : il
  // est donc juste dès la première peinture, avant même que le contexte joueur
  // ne soit chargé. Le contexte ne sert que de second recours.
  const brandName = applicationName?.trim() || gameName;

  const links = buildNavigationLinks({ document, permissions, authenticated });

  return (
    <header className="site-header">
      <Link className="brand" href={"/plateforme" as Route} aria-label={`${brandName}, présentation de la plateforme`}>
        {/* L'initiale **dérive du nom de l'instance**. Un « G » figé à côté de
            « Le Diapason » annonçait le moteur là où l'utilisateur lit le nom
            de son jeu. */}
        <span className="brand-mark" aria-hidden="true">{brandInitial(brandName)}</span>
        <span>{brandName}</span>
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
          ? <Link className="profile-button" href={primaryDestination(permissions) as Route} aria-label={`Ouvrir le profil de ${userName ?? "votre compte"}`}>{initialsOf(userName)}</Link>
          : <Link className="login-link" href={"/" as Route}><LogIn size={14} aria-hidden="true" /> Se connecter</Link>}
      </div>
    </header>
  );
}
