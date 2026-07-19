# Passage de relais

Dernière mise à jour : 19 juillet 2026, sur `main` à la révision `b4edb39`.

Ce document décrit l'état **réel** du client. Il distingue trois catégories et ne
les mélange pas : ce qui est livré et vérifié, ce qui est cassé, et ce qui est
délibérément absent. Une intention n'y est jamais écrite au présent de l'indicatif.

## Ce qui est livré et vérifié

### Socle

- Client Next.js 16 / React 19, App Router, TypeScript strict.
- Les routes serveur forment une façade vers **six** services : Authoring (5201), Play (5202), Identity (5203), Configuration (5204), PlayerExperience (5205), Organization (5206).
- Le JWT vit dans le cookie `HttpOnly` `genengine_access` ; le navigateur ne conserve que des références opaques.
- Image Next.js `standalone` multi-stage, conteneur non-root, filesystem en lecture seule, healthcheck.
- CI : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `docker compose config --quiet`, `docker build`.

### Parcours

- Identity, catalogue Authoring, session Play complète (choix legacy et typés, quiz, texte libre confirmé, pause/reprise, arbre explicable).
- Coque immersive : `body` en `100dvh` sans défilement, `main` porteur du défilement, en-tête en pastille flottante devenant barre basse sous 900 px.
- Accueil à deux niveaux — ouverture d'univers puis promesse plateforme — dans `src/features/home/model/home-content.ts`. Le contenu éditorial n'est pas lu dans la configuration d'un client : l'accueil vend le moteur, pas une histoire.
- La démonstration ne s'adresse qu'aux visiteurs anonymes : `/account` et `/play/demo` redirigent vers `/experience` dès que le cookie de session existe.
- Configurateur du familier avec un effet écrit par paramètre et un aperçu rendu par le composant de production, sans brouillon intermédiaire. L'accent pilote la propriété CSS `--familiar-accent` consommée par l'aura.
- Graphe de quête complet avec mémoire cumulée de toutes les parties, en fin de quête comme sur `/library/[versionId]`, qui lit `GET /scenario-versions/{versionId}/tree` sur Play. Une seule implémentation de disposition : la structure sans état passe par l'adaptateur `questTreeFromStructure`.
- Administration : RBAC, rôles custom, Entra ID, Azure AI Foundry, économie, périodes métier, unités, memberships, import CSV prévalidé et affectations.
- Carte à portes : une ancre par posture sur les deux illustrations, projection tenant le ratio du viewport, et décalage en spirale au-delà des clairières dessinées (`doorAnchorForIndex`) pour qu'aucune porte ne se superpose. Franchir une porte ouvre un `dialog` modal listant les scénarios du lieu ; un lieu sans contenu le dit.

### Studio de configuration

`/studio` est la surface de configuration d'un jeu. Six sections, **chacune
réellement doublée d'un aperçu** (vérifié : `figure.surface-preview` pour le jeu,
le catalogue, le familier, les libellés et les médias ; `section.scene-preview`
pour les scénarios) :

| Section | Fichier |
|---|---|
| Le jeu, Catégories & parcours, Familier, Libellés | `src/features/studio/ui/configuration-sections.tsx` |
| Médias | `src/features/studio/ui/media-section.tsx` |
| Scénarios | `src/features/studio/ui/scenario-section.tsx` |

Le Studio lit le document du plan de contrôle, le modifie et le renvoie tel quel
en conservant les champs qu'il ne connaît pas. Il partage l'endpoint
`/api/admin/configuration` avec l'Administration : les deux ne doivent pas être
ouverts en parallèle sur la même instance, le second enregistrement échouerait sur
un conflit de révision.

### Pack d'assets `diapason-core`

- 62 assets CC0 de Kenney — 46 images, 16 sons — servis sous `public/packs/diapason-core/` (68 fichiers avec les quatre licences et le manifeste amont).
- `public/packs/manifest.json` et `public/audio/manifest.json` sont **générés** par `node scripts/build-pack-manifests.mjs`, qui recalcule chaque empreinte SHA-256 depuis les octets copiés. `src/shared/assets/shipped-pack.test.ts` refait le contrôle à chaque `pnpm test`.
- Résolution en un seul point, `resolveAssetReference` : le Studio l'appelle pour ses aperçus, le runtime via `useInstanceMedia`. Un aperçu d'auteur et le rendu d'un joueur ne peuvent pas diverger.
- Le client héberge sa copie parce que la démonstration doit rester jouable **sans backend**.

### Démonstration « Le Diapason »

- 23 scènes dans `src/shared/mocks/stories.ts`, sans aucun appel réseau, jamais substituées à une erreur distante.
- Un nœud d'accueil ouvre sur **trois situations** : `note-arrivee` (Lucidité), `reunion-table` (Courage), `spec-demande` (Transmission). Le vocabulaire de tonalité est restreint aux six postures ; la démonstration n'en exerce que trois.
- **12 fins** : 3 `fin-accord-*`, 3 `fin-partielle-*`, 6 `fin-rupture-*`. Chaque situation mène à **deux** ruptures.
- 7 tests couvrent la fixture, dont l'accessibilité des 23 scènes depuis l'ouverture et la cohérence entre le préfixe d'identifiant et le champ `outcome`.

## Ce qui est cassé sur `main`

**Rien d'identifié à ce jour.**

Le seul défaut connu au moment de la rédaction — la sixième porte de la carte
inatteignable — a été corrigé et fusionné entre-temps par
[#20](https://github.com/JordanLacroix/GenEngine.Web/pull/20) (révision `b4edb39`).

Pour mémoire, parce que le piège peut revenir : `worldDoorAnchors` et
`compactWorldDoorAnchors` ne déclaraient que **cinq** ancres alors que la
configuration de référence publie **six** postures, et les portes étaient
positionnées par `anchors[index % anchors.length]` — la sixième retombait donc au
pixel près sur la première. Le correctif ajoute une sixième ancre par
illustration et, **au-delà des ancres dessinées**, décale chaque tour
supplémentaire en spirale via `doorAnchorForIndex`. Un test de non-superposition
couvre douze portes sur deux ratios de viewport.

Toute catégorie publiée au-delà de six reste donc placée, mais hors clairière
dessinée : c'est un compromis assumé, pas une position choisie à la main.

## Ce qui est délibérément absent, et pourquoi

Ces manques sont assumés et annoncés dans l'interface plutôt que simulés. Aucun
n'est un oubli.

| Manque | Cause | Conséquence visible |
|---|---|---|
| Aucune boucle d'ambiance | Le catalogue CC0 de Kenney n'en publie pas. Aucune source non CC0 n'a été substituée. | Les 5 signaux `ambience.*` restent non liés. 6 signaux sur 11 sont liés au pack. |
| Aucune musique longue | Idem : seulement des stingers courts. Les pistes de 48 s par acte restent à produire. | `music.ending` et `music.gameOver` jouent un jingle, pas une piste. |
| Aucune illustration peinte dans le pack | Kenney ne publie pas de 2D compatible avec la direction artistique Diapason. | Le pack ne contient que de l'UI, des icônes, des sfx et des stingers. Aucun décor de scène. |
| Aucun portrait de personnage dans le pack | Idem. | Le seul portrait livré est `public/illustrations/familiar-aster.jpg`, un asset projet, pas un asset du pack. |
| Rotation quotidienne | **Documentée dans la bible d'univers du dépôt `GenEngine`, jamais implémentée ici.** Le mot n'apparaît nulle part dans ce dépôt, ni en code ni en configuration. | Aucune. La capacité n'existe pas et n'est annoncée nulle part dans l'interface. |
| Game over de première classe | Le moteur ne publie que `isEnding` sur un nœud ; aucun drapeau d'échec dans `ScenarioStructureContract` ni `NarrativeTreeContract`. | L'échec est **narratif seulement**. Le champ `outcome` (`accord` / `partielle` / `rupture`) est un type **local à la démonstration** (`src/entities/story/model/story.ts`), jamais présenté comme un contrat serveur. Sur une rupture, l'interface désactive le retour arrière et promeut « Reprendre depuis le début » ; elle ne le supprime pas. |
| Médias de scène et de choix | Le schéma narratif du moteur les refuse : `PUT /scenarios/{id}/draft` répond `200` sur un document intact et `422 invalid_json` sur le même document augmenté d'un `visualUrl` de nœud et d'un `animationCue` de choix. | Le Studio édite et prévisualise, puis nomme cette cause probable quand l'enregistrement échoue. Dépendance `GenEngine`. |

### Les illustrations ne servent pas Diapason

`public/illustrations/` contient quatre visuels d'**heroic fantasy** hérités d'une
itération antérieure : `intro-gateway.jpg` (figure encapuchonnée devant un portail
doré, cité elfique), `world-map.jpg` (îles flottantes isométriques avec phare,
forêt enchantée, ruine gothique, forteresse de lave), `familiar-aster.jpg` (renard
céleste à oreilles de cristal) et `tutorial-key.jpg`.

Ils contredisent la configuration de référence — 2026, notre monde, IA partout,
un apprenti d'école d'ingénieur. La copie qui les entoure suit la même veine
(« Chaque monde commence par une porte », « une clé », « un familier »).

Précision utile : l'accueil n'utilise qu'**un seul** de ces visuels,
`intro-gateway.jpg`, en fond décoratif `aria-hidden`. Les trois autres
appartiennent aux features `experience` et `player`.

## Écarts de documentation corrigés le 19 juillet 2026

Ces affirmations figuraient dans les documents et étaient fausses ou périmées.
Elles sont listées pour éviter qu'elles ne reviennent par copie d'un ancien
handoff.

- « 113 tests Vitest » — il y en a **132**, répartis en 14 fichiers.
- « la démo comporte treize scènes pour une cible d'environ quinze minutes » — elle en compte **23**, et chaque situation se termine en quelques minutes.
- « le bloc `media` du plan de configuration est conditionné au moteur » coexistait avec « publié depuis GenEngine #46 et consommé au runtime ». La seconde affirmation est la bonne ; seuls les **médias de scène et de choix** restent refusés.
- Plusieurs jalons étaient annoncés « implémenté sur `<branche>` » alors que la branche est fusionnée dans `main` depuis longtemps.
- `specs/architecture.md` ne décrivait que **trois** API et omettait `src/shared/assets` de ses frontières.
- L'échelle `z` était présentée comme entièrement déclarée en variables. Seules quatre le sont — `--z-hud`, `--z-overlay`, `--z-fullscreen`, `--z-dialog` — et le niveau 40 s'appelle `--z-overlay`, pas `--z-panel`.
- `ART_DIRECTION` était présenté comme « source de vérité ». Aucune constante de ce nom n'existe dans ce dépôt ; le terme n'apparaît que dans un commentaire de `globals.css` et renvoie aux specs du dépôt `GenEngine`.
- Les portes de la carte étaient annoncées « réparées » et « ancrées aux repères » alors que la sixième restait inatteignable. Corrigé depuis par #20 ; l'affirmation est redevenue vraie, mais elle était fausse au moment où elle a été écrite.

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

## Ce qui n'a jamais été vérifié

- La sortie sonore **réelle** : le navigateur automatisé confirme que la lecture démarre sans erreur, pas qu'un son est audible.
- Le pack `diapason-core` servi par le backend (`GET /asset-packs/{packId}/files/…`). Les deux copies sont réputées identiques ; seule celle du client est testée.
- Les états de refus de `/library/[versionId]` — 401, `422 content_not_assigned`, 404 — sur une instance Play réelle.

## Décisions à préserver

- Backend autoritatif ; aucune règle `GenEngine.Narrative` dans le client.
- Démonstration isolée dans `src/shared/mocks`, jamais utilisée comme repli silencieux, réservée aux visiteurs anonymes.
- Une seule implémentation de disposition du graphe : la structure sans état passe par un adaptateur, pas par une seconde dérivation.
- Échanges réseau centralisés dans `src/shared/api` ; JWT en cookie `HttpOnly` ; URLs backend sans préfixe `NEXT_PUBLIC_`.
- Masquer une action dans l'interface ne remplace jamais l'autorisation serveur.
- Accessibilité clavier, contrastes et `prefers-reduced-motion`.
- Le son est optionnel, désactivé par défaut, et ne porte jamais seul une information.
- Une porte de la carte ouvre toujours une interface réelle ou dit pourquoi elle est vide.
- Une capacité que le moteur n'expose pas est annoncée absente, jamais simulée.
- Un média assigné est toujours auditionnable ou visible dans le Studio même.
- Un repère d'animation inconnu du client n'est pas joué, et l'aperçu le dit.
- Conteneur non-root, en lecture seule et observable par healthcheck.

## Critère de passage de relais réussi

Un nouvel agent doit pouvoir lire `AGENTS.md`, lancer les sept contrôles locaux,
démarrer Compose, et distinguer sans ambiguïté ce qui est livré, ce qui est cassé
et ce qui est délibérément absent — sans dépendre de l'historique de conversation.
