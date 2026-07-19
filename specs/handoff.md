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

## Refonte immersive et accueil produit

L'application est désormais plein écran de bout en bout : `body` occupe `100dvh`
sans défiler, `main` porte le défilement et l'en-tête est une HUD flottante qui
devient une barre basse sous 900 px. Le pied de page vit dans la scène.

L'accueil a été refait en deux niveaux. Une ouverture pleine page présente
l'univers de la configuration de référence « Le Diapason » — 2026, systèmes
génératifs omniprésents, recul qui s'érode, un diapason confié à une personne en
alternance — puis la promesse plateforme s'adresse à une personne qui décide :
catégories par posture, surface de configuration réelle, suivi par traces sans
classement, et ce qu'une école obtient. Aucun chiffre de résultat n'est avancé :
la plateforme décrit ce qu'elle rend observable. Le contenu éditorial vit dans
`src/features/home/model/home-content.ts` ; il n'est pas lu dans la configuration
d'un client, parce que l'accueil vend le moteur et non une histoire.

La démonstration ne s'adresse plus qu'aux visiteurs anonymes. `/account` et
`/play/demo` redirigent vers `/experience` lorsqu'un cookie de session existe,
l'accueil bascule ses appels à l'action vers « Reprendre mon univers », et
`StoryCard` ne renvoie plus vers la démonstration lorsqu'une histoire n'a pas de
version publiée — elle annonce l'indisponibilité. Vérifié : zéro occurrence de
`/play/demo` dans le HTML de `/`, `/library`, `/account` et `/experience` en état
connecté.

### Portes de la carte

Deux défauts distincts empêchaient une porte de mener quelque part.

1. `/api/me` restreignait le catalogue aux affectations d'organisation dès que la
   portée n'était pas globale. Une personne non rattachée — le cas d'un compte
   fraîchement créé — se retrouvait donc avec zéro catégorie et une carte sans
   aucune porte. La restriction ne s'applique plus qu'aux personnes réellement
   membres ; l'autorisation reste celle de Play, qui refuse un démarrage non
   affecté par `422 content_not_assigned`.
2. Le rattachement comparait `category.scenarioIds` à l'identifiant de *version*,
   jamais à l'identifiant de scénario, et le `categoryId` publié par le catalogue
   n'était pas transporté par le client. Les deux liaisons sont désormais
   exprimées en identifiant de scénario dans `map-places.ts`.

Franchir une porte ouvre maintenant une interface réelle : `PlaceOverlay` liste
les scénarios du lieu avec durée, découverte cumulée, obligation et échéance
issues des affectations, et propose de jouer ou de relire la mémoire du parcours.
Un lieu sans contenu le dit ; une configuration où rien n'est classé l'annonce au
lieu d'afficher des portes vides. Le panneau est un `dialog` modal avec piège de
focus et fermeture au clavier.

### Familier

Le modèle du moteur était largement plus riche que l'interface. Style
d'explication, accent et capacités sont désormais exposés, et le style et l'accent
sont envoyés depuis l'état réglé au lieu d'être recopiés de la définition. Chaque
paramètre est doublé de son effet en une phrase, et l'aperçu rend la différence
visible avant validation : la forme change la silhouette, l'accent pilote une
propriété CSS `--familiar-accent` consommée par l'aura, et une réplique d'exemple
est recomposée à chaque réglage à partir du ton, du style et du niveau d'aide.
L'aperçu lit l'état en cours sans brouillon intermédiaire : ce qui est montré est
ce qui sera enregistré.

### Audio

`src/shared/audio` prépare la lecture sonore configurable derrière un contrat
stable : ambiances par lieu, signatures de choix, d'erreur, de récompense et
d'ouverture, musiques de fin. Le moteur et le pack d'assets sont produits par
d'autres tranches ; tant qu'aucun `/audio/manifest.json` n'est publié, la source
reste silencieuse et le réglage de la HUD est désactivé avec la raison affichée.
Le son est désactivé par défaut, ne porte jamais seul une information, et
l'ambiance continue reste coupée sous `prefers-reduced-motion`. Le contrat attendu
est documenté dans `public/audio/README.md`.

### Palette

Les cinq teintes de `ART_DIRECTION` deviennent la source de vérité — encre
`#17344a`, ivoire `#fffaf0`, sauge `#7a9a55`, or `#d7a746`, azur `#2f7fa0` — et
les alias historiques `ink`/`ivory`/`ember`/`verdigris` en dérivent, ce qui fait
suivre les feuilles existantes sans les réécrire ligne à ligne.

## Prochaine unité de travail

La plateforme configurable est raccordée : permissions, rôles custom, Entra ID, Azure AI Foundry, familier, économie/magasin et Studio contextualisé. L’espace « Structures & affectations » consomme maintenant le service Organization pour gérer périodes métier, unités hiérarchiques, participants, encadrants, import CSV prévalidé et affectations avec suppression. Les contrats backend restent autoritatifs : Play résout les parcours au démarrage et la carte filtre les catégories d'un membre selon ses affectations.

Sur `feat/product-operations-ui`, l'Administration est réorganisée par domaines et intègre une console utilisateurs recherchable, le cycle de vie des rôles custom, parcours/catégories/rattachements et la configuration visuelle du familier. Le Studio est devenu un éditeur low-code avec bibliothèque, graphe sélectionnable, inspecteur de scènes/choix, validation, prévisualisation, publication et archivage. La bibliothèque affiche la progression par catégorie et la démo comporte treize scènes pour une cible d'environ quinze minutes.

Validation de la tranche immersive : typecheck, lint sans warning, 3 tests Vitest et build Next.js production réussis le 18 juillet 2026.

Validation de la tranche Organization : typecheck, lint, tests Vitest et build Next.js production réussis le 18 juillet 2026.

Validation du seuil narratif : revue visuelle navigateur du compte, de l’intro, des interactions et du bilan ; lint, typecheck, 6 tests Vitest, build Next.js, Compose, image Docker durcie et sondes HTTP des illustrations réussis le 18 juillet 2026.

Validation du graphe de quête : lint sans warning, typecheck, 35 tests Vitest (dont 26 sur `buildQuestGraph`) et build Next.js production réussis le 19 juillet 2026. Revue navigateur de la démonstration sur deux parcours successifs : la mémoire cumulée fait passer la découverte de 46 % à 77 % et révèle les deux fins.

Validation de la stabilisation joueur : revue visuelle navigateur de la carte, du configurateur et du journal ; localisation, déduplication et projection de carte couvertes par tests unitaires le 18 juillet 2026.

Validation de la carte hors partie : lint sans warning, typecheck, 47 tests Vitest (dont 12 sur la structure sans état) et build Next.js production réussis le 19 juillet 2026. Non vérifié contre un backend en fonctionnement : la route serveur et les états de refus n'ont pas été exercés sur une instance Play réelle.

Validation de la refonte immersive : lint sans warning, typecheck, 84 tests
Vitest et build Next.js production réussis le 19 juillet 2026. Revue navigateur
contre les six API locales (ports 5201-5206) : accueil anonyme et connecté,
coque plein écran et barre basse mobile, portes de la carte reproduites vides
puis réparées, panneau de lieu ouvert au clic et fermé par Échap, aperçu du
familier vérifié paramètre par paramètre, et absence de la démonstration en état
connecté sur `/`, `/account`, `/play/demo`, `/library` et `/experience`.

## Décisions à préserver

- Backend autoritatif et aucune règle Narrative dans le client.
- Démonstration isolée, jamais utilisée comme fallback silencieux.
- Une seule implémentation de disposition du graphe : la structure sans état passe par un adaptateur, pas par une seconde dérivation.
- Échanges réseau centralisés dans `src/shared/api`.
- JWT en cookie `HttpOnly` et variables backend côté serveur.
- Accessibilité clavier, contrastes et réduction des animations.
- La démonstration ne s'adresse qu'aux visiteurs anonymes.
- Le son est optionnel, désactivé par défaut, et ne porte jamais seul une information.
- Une porte de la carte ouvre toujours une interface réelle ou dit pourquoi elle est vide.
- L'aperçu du familier est rendu par le composant de production, sans brouillon intermédiaire.
- Conteneur non-root, en lecture seule et observable par healthcheck.

## Critère de passage de relais réussi

Un nouvel agent doit pouvoir lire `AGENTS.md`, lancer les contrôles locaux, démarrer Compose et identifier la prochaine tranche sans dépendre de l’historique de conversation.
