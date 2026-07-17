"use client";

import { BookOpen, Compass, Feather, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Découvrir", icon: Compass },
  { href: "/library", label: "Bibliothèque", icon: BookOpen },
  { href: "/studio", label: "Studio", icon: Feather },
] as const;

export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="GenEngine, accueil">
        <span className="brand-mark" aria-hidden="true">G</span>
        <span>GenEngine</span>
      </Link>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-navigation">
        <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav id="main-navigation" className={open ? "main-nav is-open" : "main-nav"} aria-label="Navigation principale">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === href : path.startsWith(href);
          return <Link key={href} href={href} className={active ? "nav-link is-active" : "nav-link"} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={16} aria-hidden="true" />{label}</Link>;
        })}
      </nav>
      <Link className="profile-button" href="/library" aria-label="Ouvrir le profil de Camille">CM</Link>
    </header>
  );
}
