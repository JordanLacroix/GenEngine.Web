"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { PublishedExperienceContract, UserContextContract } from "@/shared/api/contracts";
import { fallbackApplicationName } from "@/shared/ui/branding-theme";

export interface NavigationContext {
  document?: UserContextContract["experience"]["document"];
  permissions: ReadonlySet<string>;
  authenticated: boolean;
  userName?: string;
  gameName: string;
}

/**
 * Contexte partagé par tous les porteurs de navigation — en-tête global,
 * barre latérale du Studio, barre latérale de l'Administration.
 *
 * Il ne décide d'aucun droit : masquer une entrée relève de la présentation,
 * le service propriétaire reste seul juge (invariant 10).
 */
export function useNavigationContext(): NavigationContext {
  const path = usePathname();
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

  return useMemo(() => {
    const document = context?.experience.document ?? experience?.document;
    return {
      document,
      permissions: new Set(context?.access.permissions ?? []),
      authenticated: Boolean(context),
      userName: context?.access.userName,
      // Le nom de marque publié prime sur le nom du jeu : `branding` existe
      // précisément pour nommer l'instance. « GenEngine » reste le repli d'une
      // configuration illisible, et il nomme alors le moteur, pas un jeu.
      gameName: document?.branding?.applicationName?.trim()
        || document?.game.name
        || fallbackApplicationName,
    };
  }, [context, experience]);
}

export function initialsOf(userName: string | undefined): string {
  return userName?.split(/[\s._-]/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase()).join("") ?? "";
}
