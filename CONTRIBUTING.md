# Contribuer à GenEngine Web

Le dépôt privilégie les changements petits, vérifiables et reliés à un besoin explicite.

## Avant de commencer

- Lisez [`AGENTS.md`](AGENTS.md) : c’est la **source unique** des instructions du dépôt, humaines comme agents. [`CLAUDE.md`](CLAUDE.md) n’est qu’un pointeur vers lui, et les deux ne doivent jamais être dupliqués.
- Consultez le README, les specs et les issues existantes.
- Lisez [`specs/handoff.md`](specs/handoff.md), qui distingue ce qui est livré, ce qui est cassé sur `main` et ce qui est délibérément absent.
- Validez d’abord le besoin pour toute évolution structurante ou nouveau parcours produit.
- Ne publiez jamais une vulnérabilité exploitable dans une issue ; utilisez le [signalement privé](https://github.com/JordanLacroix/GenEngine.Web/security/advisories/new).

## Environnement local

Prérequis : Node.js 22 ou plus, pnpm 10.28 ou plus.

Ces sept commandes sont **exactement** celles du job `quality` de
[`.github/workflows/ci.yml`](.github/workflows/ci.yml), dans le même ordre. Les
cinq premières suffisent pour un changement qui ne touche ni Docker ni Compose.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config --quiet
docker build --tag genengine-web:local .
```

Il n’existe **pas** de linter Markdown dans ce dépôt : la CI ne vérifie que le
TypeScript, les tests, le build, Compose et l’image Docker. La justesse de la
documentation reste donc une responsabilité de revue.

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
- README, specs et handoff reflètent l’état réel — **une intention n’est jamais écrite comme un fait livré**, et un manque connu est consigné plutôt que tu ;
- aucun secret, `.env.local` ou artefact généré n’est ajouté ;
- tous les contrôles GitHub requis sont verts.

## Contributions assistées par IA

Les outils d’IA sont autorisés, mais l’auteur reste responsable de chaque modification. Indiquez les invariants consultés, les zones à risque et les validations réellement exécutées. Ne transmettez aucun secret, donnée personnelle ou code non publiable à un service externe.
