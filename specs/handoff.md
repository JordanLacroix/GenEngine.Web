# Passage de relais

Dernière mise à jour : 18 juillet 2026.

## État vérifié

- `main` contient un client Next.js avec TypeScript strict et App Router.
- La démonstration hors ligne reste isolée dans `src/shared/mocks`.
- Le client consomme le catalogue Authoring, Identity et le parcours Play complet.
- Le JWT reste dans un cookie `HttpOnly` et les références de session sont opaques.
- Les routes serveur forment une façade vers les trois API.
- Une image Next.js standalone et un workflow Compose durci sont disponibles.
- La CI exécute lint, typecheck, tests, build, validation Compose et build Docker.
- Le shell joueur consomme `GET /me/experience/bootstrap` et ne déduit plus localement l'ordre familier → tutoriel → carte.
- L'introduction publique, la page compte, la carte, le journal, le familier illustré, le magasin et l'aide sont disponibles.

## Démarrage rapide de reprise

```bash
git status --short --branch
git pull --ff-only
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Pour le parcours conteneurisé :

```bash
docker compose up --build --detach --wait
curl --fail http://localhost:3001/
docker compose down
```

## Prochaine unité de travail

La plateforme configurable est raccordée : permissions, rôles custom, Entra ID, Azure AI Foundry, familier, économie/magasin et Studio contextualisé. L’espace « Structures & affectations » consomme maintenant le service Organization pour gérer unités hiérarchiques, participants, encadrants et affectations avec suppression. Les contrats backend restent autoritatifs et Play applique ces affectations au démarrage.

Sur `feat/product-operations-ui`, l'Administration est réorganisée par domaines et intègre une console utilisateurs recherchable, le cycle de vie des rôles custom, parcours/catégories/rattachements et la configuration visuelle du familier. Le Studio est devenu un éditeur low-code avec bibliothèque, graphe sélectionnable, inspecteur de scènes/choix, validation, prévisualisation, publication et archivage. La bibliothèque affiche la progression par catégorie et la démo comporte treize scènes pour une cible d'environ quinze minutes.

Validation de la tranche immersive : typecheck, lint sans warning, 3 tests Vitest et build Next.js production réussis le 18 juillet 2026.

Validation de la tranche Organization : typecheck, lint, tests Vitest et build Next.js production réussis le 18 juillet 2026.

## Décisions à préserver

- Backend autoritatif et aucune règle Narrative dans le client.
- Démonstration isolée, jamais utilisée comme fallback silencieux.
- Échanges réseau centralisés dans `src/shared/api`.
- JWT en cookie `HttpOnly` et variables backend côté serveur.
- Accessibilité clavier, contrastes et réduction des animations.
- Conteneur non-root, en lecture seule et observable par healthcheck.

## Critère de passage de relais réussi

Un nouvel agent doit pouvoir lire `AGENTS.md`, lancer les contrôles locaux, démarrer Compose et identifier la prochaine tranche sans dépendre de l’historique de conversation.
