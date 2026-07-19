import {
  BookOpen, Compass, Feather, LogIn, PlayCircle, Settings2, Sliders, Sparkles,
} from "lucide-react";
import type { ExperienceDocumentContract } from "@/shared/api/contracts";
import { gameCopy } from "@/shared/lib/game-copy";

export interface NavigationLink {
  readonly href: string;
  readonly label: string;
  readonly icon: typeof Compass;
}

/**
 * Les routes qui portent leur propre navigation.
 *
 * Sur celles-ci l'en-tête global ne s'affiche pas : la double navigation
 * venait de son cumul avec le rail de l'univers joueur et les barres latérales
 * du Studio et de l'Administration. Les barres latérales restent — ce sont des
 * navigations *intra-section* légitimes — et accueillent désormais les liens
 * globaux.
 */
const selfNavigatedPrefixes = ["/experience", "/play", "/administration", "/studio"] as const;

export function hasOwnNavigation(pathname: string): boolean {
  return selfNavigatedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Les entrées de navigation, selon l'état de session et les permissions
 * effectives — jamais un nom de rôle, qui est personnalisable par l'exploitant.
 *
 * `/parametres` est présent dans les deux états : configurer l'adresse du
 * serveur est précisément ce qu'on fait **avant** de pouvoir se connecter.
 * La démonstration, elle, ne s'adresse qu'aux visiteurs anonymes.
 */
export function buildNavigationLinks(options: {
  document?: ExperienceDocumentContract;
  permissions: ReadonlySet<string>;
  authenticated: boolean;
}): NavigationLink[] {
  const { document, permissions, authenticated } = options;
  const copy = (key: string, fallback: string) => gameCopy(document, key, fallback);

  if (!authenticated) {
    return [
      { href: "/", label: copy("nav.signIn", "Connexion"), icon: LogIn },
      { href: "/play/demo", label: copy("nav.demo", "Démonstration"), icon: PlayCircle },
      { href: "/plateforme", label: copy("nav.platform", "La plateforme"), icon: Compass },
      { href: "/library", label: copy("nav.library", "Bibliothèque"), icon: BookOpen },
      { href: "/parametres", label: copy("nav.settings", "Paramètres"), icon: Sliders },
    ];
  }

  return [
    ...(permissions.has("session.play") ? [{ href: "/experience", label: copy("nav.experience", "Mon univers"), icon: Sparkles }] : []),
    { href: "/library", label: copy("nav.library", "Bibliothèque"), icon: BookOpen },
    ...(permissions.has("scenario.author") ? [{ href: "/studio", label: copy("nav.studio", "Studio"), icon: Feather }] : []),
    ...(permissions.has("config.read") ? [{ href: "/administration", label: copy("nav.administration", "Administration"), icon: Settings2 }] : []),
    { href: "/plateforme", label: copy("nav.platform", "La plateforme"), icon: Compass },
    { href: "/parametres", label: copy("nav.settings", "Paramètres"), icon: Sliders },
  ];
}

export function isActiveLink(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Où envoyer quelqu'un qui vient de s'authentifier, ou qui clique son profil.
 *
 * `/experience` n'est proposé qu'avec `session.play` ; y rediriger tout le
 * monde envoyait un compte d'auteur ou d'administration pur sur un écran hors
 * de sa portée. On retient donc la première destination réellement proposée,
 * et `/library` reste le repli — il ne demande aucune permission.
 */
export function primaryDestination(permissions: ReadonlySet<string>): string {
  const links = buildNavigationLinks({ permissions, authenticated: true });
  return links[0]?.href ?? "/library";
}
