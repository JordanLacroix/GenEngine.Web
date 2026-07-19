"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { AudioToggle } from "@/shared/ui/audio-toggle";
import { buildNavigationLinks, isActiveLink } from "@/shared/ui/navigation-model";
import { useNavigationContext } from "@/shared/ui/use-navigation-context";

/**
 * Navigation globale repliée dans une barre latérale de section.
 *
 * Le Studio et l'Administration gardent leur propre navigation interne — c'est
 * une navigation intra-section légitime. Ce qui posait problème était son
 * cumul avec l'en-tête flottant : les liens globaux vivent donc ici, au-dessus
 * des onglets de la section, et l'en-tête ne s'affiche plus sur ces routes.
 */
export function SectionNav({ label }: { label: string }) {
  const path = usePathname();
  const { document, permissions, authenticated, gameName } = useNavigationContext();
  const links = buildNavigationLinks({ document, permissions, authenticated })
    .filter((link) => !isActiveLink(path, link.href));

  return <div className="section-nav">
    <div className="section-nav-brand">
      <Link href={"/plateforme" as Route} aria-label={`${gameName}, présentation de la plateforme`}>
        <span aria-hidden="true">G</span>
        <span className="section-nav-name">{gameName}</span>
      </Link>
      <AudioToggle />
    </div>
    <p className="section-nav-current">{label}</p>
    <nav aria-label="Navigation principale">
      {links.map(({ href, label: linkLabel, icon: Icon }) => (
        <Link key={href} href={href as Route} className="section-nav-link">
          <Icon size={15} aria-hidden="true" />{linkLabel}
        </Link>
      ))}
    </nav>
  </div>;
}
