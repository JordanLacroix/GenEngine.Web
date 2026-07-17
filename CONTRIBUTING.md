# Contribuer à GenEngine Web

Le dépôt privilégie les changements petits, vérifiables et reliés à un besoin explicite.

## Avant de commencer

- Consultez le README, les specs et les issues existantes.
- Validez d’abord le besoin pour toute évolution structurante ou nouveau parcours produit.
- Ne publiez jamais une vulnérabilité exploitable dans une issue ; utilisez le [signalement privé](https://github.com/JordanLacroix/GenEngine.Web/security/advisories/new).

## Environnement local

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Workflow

1. Créez une branche courte depuis `main` : `feat/sujet`, `fix/sujet` ou `docs/sujet`.
2. Implémentez une seule préoccupation cohérente.
3. Ajoutez les tests et la documentation nécessaires.
4. Utilisez des commits conventionnels : `type(scope): description`.
5. Ouvrez une pull request et remplissez les sections pertinentes du modèle.
6. Corrigez les contrôles automatiques et résolvez les conversations de revue.

## Définition de terminé

Un changement est prêt lorsque :

- le besoin et ses critères d’acceptation sont satisfaits ;
- lint, typecheck, tests et build passent ;
- les invariants, l’accessibilité et la séparation démo/production sont préservés ;
- le build Docker et la configuration Compose restent valides lorsqu’ils sont concernés ;
- les changements d’API, de configuration ou d’architecture sont documentés ;
- README, specs et handoff reflètent l’état réel ;
- aucun secret, `.env.local` ou artefact généré n’est ajouté ;
- tous les contrôles GitHub requis sont verts.

## Contributions assistées par IA

Les outils d’IA sont autorisés, mais l’auteur reste responsable de chaque modification. Indiquez les invariants consultés, les zones à risque et les validations réellement exécutées. Ne transmettez aucun secret, donnée personnelle ou code non publiable à un service externe.
