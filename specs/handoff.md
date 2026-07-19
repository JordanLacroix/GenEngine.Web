# Passage de relais

Dernière mise à jour : 19 juillet 2026.

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
- Le seuil narratif est rejouable depuis la connexion, qui propose la démo sous le formulaire sans afficher de profil avant authentification.
- Le prologue est illustré, matérialise les interactions configurées, remet une clé et ouvre une carte à portes.
- Les packs visuels de familier sont importables localement avec licence et attribution, sans notion de propriété.
- La démo s’arrête sur un bilan du chemin et des gains au lieu de boucler.
- La fin de quête et la page `/library/[versionId]` affichent le graphe complet du récit avec la mémoire cumulée de toutes les parties, en mode connecté comme en démonstration.
- La page `/library/[versionId]` lit la structure réelle de la version publiée sur Play, sans session ouverte ni repli sur une fixture.
- La passe de stabilisation de l’univers joueur localise les valeurs moteur, déduplique journal et maîtrises, rend la sauvegarde du compagnon accessible et projette les portes sur les repères réels de l’illustration quel que soit le ratio d’écran.

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

## Graphe hors partie

La limite est levée. Play expose désormais `GET /scenario-versions/{versionId}/tree` : la topologie d'une version publiée, sans session. Le contrat est volontairement distinct de `NarrativeTreeContract` et ne porte ni `state` de nœud ni `evaluation` de condition, ces valeurs dépendant d'un état de monde qui n'existe pas hors partie.

`/library/[versionId]` ne réutilise plus la dernière session de l'appareil : la page appelle la route serveur `/api/scenario-versions/[id]/tree`, adapte la structure avec `questTreeFromStructure` et rend le graphe avec la maîtrise cumulée. Hors partie, un nœud est `discoveredBefore` s'il figure dans la maîtrise, `unseen` sinon ; ni `current`, ni `takenThisRun`, ni `locked` ne peuvent apparaître, et la légende est réduite en conséquence. La disponibilité des passages n'étant pas évaluée, le client ne l'affirme pas.

L'autorisation reste celle du démarrage de session : 401 sans jeton, 422 `content_not_assigned` pour un joueur non affecté, 404 pour une version inconnue. Chaque refus produit un message explicite ; aucune fixture ne remplace une erreur distante.

## Prochaine unité de travail

La plateforme configurable est raccordée : permissions, rôles custom, Entra ID, Azure AI Foundry, familier, économie/magasin et Studio contextualisé. L’espace « Structures & affectations » consomme maintenant le service Organization pour gérer périodes métier, unités hiérarchiques, participants, encadrants, import CSV prévalidé et affectations avec suppression. Les contrats backend restent autoritatifs : Play résout les parcours au démarrage et la carte filtre les catégories d'un membre selon ses affectations.

Sur `feat/product-operations-ui`, l'Administration est réorganisée par domaines et intègre une console utilisateurs recherchable, le cycle de vie des rôles custom, parcours/catégories/rattachements et la configuration visuelle du familier. Le Studio est devenu un éditeur low-code avec bibliothèque, graphe sélectionnable, inspecteur de scènes/choix, validation, prévisualisation, publication et archivage. La bibliothèque affiche la progression par catégorie et la démo comporte treize scènes pour une cible d'environ quinze minutes.

Validation de la tranche immersive : typecheck, lint sans warning, 3 tests Vitest et build Next.js production réussis le 18 juillet 2026.

Validation de la tranche Organization : typecheck, lint, tests Vitest et build Next.js production réussis le 18 juillet 2026.

Validation du seuil narratif : revue visuelle navigateur du compte, de l’intro, des interactions et du bilan ; lint, typecheck, 6 tests Vitest, build Next.js, Compose, image Docker durcie et sondes HTTP des illustrations réussis le 18 juillet 2026.

Validation du graphe de quête : lint sans warning, typecheck, 35 tests Vitest (dont 26 sur `buildQuestGraph`) et build Next.js production réussis le 19 juillet 2026. Revue navigateur de la démonstration sur deux parcours successifs : la mémoire cumulée fait passer la découverte de 46 % à 77 % et révèle les deux fins.

Validation de la stabilisation joueur : revue visuelle navigateur de la carte, du configurateur et du journal ; localisation, déduplication et projection de carte couvertes par tests unitaires le 18 juillet 2026.

Validation de la carte hors partie : lint sans warning, typecheck, 47 tests Vitest (dont 12 sur la structure sans état) et build Next.js production réussis le 19 juillet 2026. Non vérifié contre un backend en fonctionnement : la route serveur et les états de refus n'ont pas été exercés sur une instance Play réelle.

## Décisions à préserver

- Backend autoritatif et aucune règle Narrative dans le client.
- Démonstration isolée, jamais utilisée comme fallback silencieux.
- Une seule implémentation de disposition du graphe : la structure sans état passe par un adaptateur, pas par une seconde dérivation.
- Échanges réseau centralisés dans `src/shared/api`.
- JWT en cookie `HttpOnly` et variables backend côté serveur.
- Accessibilité clavier, contrastes et réduction des animations.
- Conteneur non-root, en lecture seule et observable par healthcheck.

## Critère de passage de relais réussi

Un nouvel agent doit pouvoir lire `AGENTS.md`, lancer les contrôles locaux, démarrer Compose et identifier la prochaine tranche sans dépendre de l’historique de conversation.
