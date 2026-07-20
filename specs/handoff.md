# Passage de relais

Dernière mise à jour : 21 juillet 2026, sur `feat/web-profile-stats-rewards`.

Ce document décrit l'état **réel** du client. Il distingue trois catégories et ne
les mélange pas : ce qui est livré et vérifié, ce qui est cassé, et ce qui est
délibérément absent. Une intention n'y est jamais écrite au présent de l'indicatif.

## Ce qui est livré et vérifié

### Socle

- Client Next.js 16 / React 19, App Router, TypeScript strict.
- Les routes serveur forment une façade vers **six** services : Authoring (5201), Play (5202), Identity (5203), Configuration (5204), PlayerExperience (5205), Organization (5206).
- Le JWT vit dans le cookie `HttpOnly` `genengine_access` ; le navigateur ne conserve que des références opaques.
- Image Next.js `standalone` multi-stage, conteneur non-root, filesystem en lecture seule, healthcheck.
- CI qualité : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `docker compose config --quiet`, `docker build`.
- La coque lit `GET /client-bootstrap/default` à chaque rendu, ce qui rend `/account`, `/administration`, `/experience` et `/library` **dynamiques** alors qu'elles étaient statiques. C'est assumé : ces quatre pages sont des coques qui appellent `/api/me` dès le montage, leur HTML statique ne portait rien, et le rendu serveur est ce qui évite d'afficher « GenEngine » puis « Le Diapason » à la première peinture.
- CI gouvernance : revue de dépendances, CodeQL (JavaScript/TypeScript), qualité documentaire (markdownlint et lychee), politique de titre de PR, sécurité des workflows (actionlint et zizmor), Scorecard OpenSSF. Voir le tableau dans [`CONTRIBUTING.md`](../CONTRIBUTING.md).

### Entrée, navigation et retours

- L'atterrissage `/` est le **seuil de connexion**. La démonstration y est
  proposée **deux fois** : un bouton sous le formulaire et une entrée de menu.
  La présentation commerciale a déménagé sur `/plateforme`, sans perte ;
  `/account` redirige en permanence vers `/`.
- `/parametres` règle les six URLs de services, en mode groupé ou unitaire,
  **sans session ouverte**, avec un test de joignabilité par service exécuté
  côté serveur. La surcharge voyage dans un cookie `HttpOnly` relu par
  `resolveServiceUrl()` : elle a un effet réel, borné à ce navigateur, et
  gouverné par `GENENGINE_ALLOW_ENDPOINT_OVERRIDE`. Les hôtes visables sont
  bornés par `GENENGINE_ENDPOINT_ALLOWED_HOSTS` — la convention locale par
  défaut — pour que l'écran ne devienne pas un relais vers le réseau interne.
- Un seul système de navigation est visible à la fois. L'en-tête global ne se
  monte plus sur `/experience`, `/play`, `/studio` ni `/administration`, y
  compris pendant leurs états de chargement. Les barres latérales du Studio et
  de l'Administration portent les liens globaux.
- `/play/demo`, `/play/[versionId]`, `/administration` et `/studio` sont en
  plein écran à HUD flottante, comme `/experience`. La bibliothèque garde un
  bandeau compact au lieu d'un titre pleine hauteur ; la densité des tableaux
  d'administration est préservée, la barre latérale et le contenu défilant
  séparément.
- Système unifié de confirmation et de retour dans `src/shared/ui/feedback-provider.tsx` :
  piège de focus, Escape, restitution du focus au déclencheur,
  `role="alertdialog"` pour les actions destructives, et bandeaux de succès
  qui n'existaient pas. Les **cinq `window.confirm`** ont disparu ; la
  déconnexion et la remise à zéro du tutoriel sont désormais confirmées.

### Parcours

- Identity, catalogue Authoring, session Play complète (choix legacy et typés, quiz, texte libre confirmé, pause/reprise, arbre explicable).
- Catalogue **paginé** : le client décode l'enveloppe `{ items, page, pageSize, total }`, envoie `page`/`pageSize`/`query` et n'utilise plus `offset`/`limit`. La bibliothèque charge 24 récits à la fois avec un bouton « Charger la suite » et annonce le `total` du serveur ; sa recherche est exécutée par le backend. La carte des passages assemble le catalogue entier côté serveur, parce qu'une porte compte ses récits. Les écrans qui n'ont besoin que d'un titre le résolvent par identifiant de version. Détail du raisonnement par écran dans le README.
- Coque immersive : `body` en `100dvh` sans défilement, `main` porteur du défilement, en-tête en pastille flottante devenant barre basse sous 900 px.
- Accueil à deux niveaux — ouverture d'univers puis promesse plateforme — dans `src/features/home/model/home-content.ts`. Le contenu éditorial n'est pas lu dans la configuration d'un client : l'accueil vend le moteur, pas une histoire.
- La démonstration ne s'adresse qu'aux visiteurs anonymes : `/account` et `/play/demo` redirigent vers `/experience` dès que le cookie de session existe.
- Configurateur du familier avec un effet écrit par paramètre et un aperçu rendu par le composant de production, sans brouillon intermédiaire. L'accent pilote la propriété CSS `--familiar-accent` consommée par l'aura.
- Graphe de quête complet avec mémoire cumulée de toutes les parties, en fin de quête comme sur `/library/[versionId]`, qui lit `GET /scenario-versions/{versionId}/tree` sur Play. Une seule implémentation de disposition : la structure sans état passe par l'adaptateur `questTreeFromStructure`.
- Administration : RBAC, rôles custom, Entra ID, Azure AI Foundry, économie, périodes métier, unités, memberships, import CSV prévalidé et affectations.
- Carte à portes : une ancre par posture sur les deux illustrations, projection tenant le ratio du viewport, et décalage en spirale au-delà des clairières dessinées (`doorAnchorForIndex`) pour qu'aucune porte ne se superpose. Franchir une porte ouvre un `dialog` modal listant les scénarios du lieu ; un lieu sans contenu le dit.
- Profil joueur (onglet Compte) : les **statistiques joueur** (`stats`) sont rendues en jauges libellé/valeur/plafond doublées d'un texte, et les **récompenses conditionnelles** (`rewards`) en obtenues (avec date) et à venir (progression par condition), sans porte fermée. Les deux blocs sont **facultatifs** : sur une instance qui ne les publie pas, `/me/experience` les renvoie vides ou absents et l'écran l'affiche sans rien fabriquer. La logique de présentation et le décodage tolérant (`mode` et nature d'octroi en union `X | string`) vivent dans `src/features/experience/model/profile-progress.ts`, testés. Non vérifié visuellement : l'instance locale sert les deux blocs **vides** et le compte de test reste bloqué avant la carte, donc seuls les états vides seraient rendus ; la forme des données a été confrontée aux records du moteur (`PlayerStatView`, `ConditionalRewardView`, `ProgressConditionProgress`, `RewardGrantPlan`) et au flux `/api/me`.

### Documents consultables (schéma de scénario v6)

Vérifié en conditions réelles contre la pile locale. **Les dix scénarios** de la
configuration de référence portent un document facultatif dont la consultation
ouvre un choix conditionné, sur **six natures** distinctes. Les six ont été
ouvertes à l'écran :

| Nature | Scénario témoin | Ce qui est rendu |
|---|---|---|
| `Table` | *Le tri des candidatures* | Une vraie `<table>` de 4 colonnes, en-tête `Source`, paragraphe de commentaire, « 6 lignes affichées sur 412 ». |
| `Diff` | *La revue automatique* | Lignes `Context` / `Removed` / `Added`, numérotées par leur `label`, gouttière `+` / `−` et couleur. **Aucun `excerpt` déclaré, donc aucune mention affichée.** |
| `Log` | *Identité non reconnue* | Journal aligné en chasse fixe, horodatage en `label`, `Error` en rouge et `Warning` en ambre, « 9 entrées affichées sur 1 348 ». |
| `Code` | *Le signalement* | Bloc `lines` numéroté **et** bloc `table` dans le même document — les deux formes cohabitent sans réglage particulier. |
| `Memo` | *La note de service* | Quatre en-têtes (`Objet`, `De`, `Date`, `Signataire`), prose en typographie de lecture, « 4 paragraphes affichés sur 27 ». |
| `Report` | *La réunion où personne ne doute* | `lines` étiquetées `POINT n`, table, paragraphe, « 4 paragraphes affichés sur 96 ». |

Marqueurs réellement servis par le contenu : `Added`, `Removed`, `Context`,
`Warning`, `Error`. Unités réellement servies : `Lines`, `Rows`, `Entries`,
`Paragraphs`. `Info` et `Messages` sont gérés sans être exercés.

- `kind: "Document"`, `document`, `isOptional` et `exitChoices` sont décrits dans `src/shared/api/contracts.ts`.
- Le rendu vit dans `src/features/player/ui/document-view.tsx` ; les décisions de présentation testables — nature, forme, marqueurs, phrase d'échantillon — dans `src/features/player/model/document-presentation.ts` (16 tests, fixtures relevées sur la pile réelle).
- **La consultation n'est jamais imposée** : les `exitChoices` sont rendus à côté du document, sous « Sans ouvrir le document ». Le composant `ExitChoices` les affiche pour toute interaction facultative, pas seulement pour un document.
- `POST /sessions/{id}/document-consultations` passe par `/api/sessions/[id]` sous le verbe `consult`, avec `commandId` et `expectedRevision` comme toute commande joueur.
- **Vérifié à l'écran, sur deux scénarios distincts** : le document présente **trois** choix de sortie ; après consultation, l'étape suivante en présente **quatre**. Sur *Le tri des candidatures* le quatrième est « Le 380e est pénalisé pour une interruption de parcours : demander ce que l'outil en sait vraiment » ; sur *La réunion où personne ne doute*, « Lire le point 3 mot pour mot, puis demander à quelle date les sources ont été indexées ». Aucun des deux n'existe pour qui n'a pas lu.

L'échantillon s'annonce toujours en toutes lettres. `excerptSentence` est la
seule fonction qui compose cette phrase, et un test fige « 6 lignes affichées
sur 412 » : un échantillon présenté comme un tout serait un mensonge
d'interface, et le jeu porte précisément sur la lucidité face à l'information.

### Marque et palette de l'instance

`GET /client-bootstrap/{frontId}` — anonyme — est lu **côté serveur** par la
coque (`src/shared/api/client-bootstrap.ts`). Une configuration illisible
retombe sur « GenEngine », qui nomme alors le moteur et non un jeu.

- Le titre du document porte le nom de l'instance : `Le Diapason — …` en défaut, `%s · Le Diapason` en gabarit.
- La pastille de marque **dérive son initiale du nom** (`brandInitial`) aux trois endroits qui la portent : en-tête global, `SectionNav`, et le HUD de `/experience`. Le « G » codé en dur a disparu. « Le Diapason » donne « D » — l'article initial est écarté.
- `/parametres` dit « Le Diapason n'est qu'un client », plus « GenEngine Web ».
- Le pied de page nomme l'instance, et crédite le moteur en seconde ligne.
- `branding.theme.colors` et `branding.accentPalette` sont projetés en variables CSS sur `:root` **au rendu serveur** (`brandingStyleSheet`), donc sans bascule de couleur à la première peinture. Chaque teinte de `globals.css` les lit avec son littéral en repli : une instance sans bloc `branding` rend exactement comme avant.
- Conséquence directe : `categories[].accent` est **enfin rendu**. Les portes de la carte portaient toutes le même or alors que `place.accent` était calculé puis jeté ; elles portent maintenant leur jeton (`--door-accent`), avec repli neutre pour un jeton absent de la palette.

Une couleur qui n'est pas un hexadécimal strict est **écartée**, pas réécrite :
le moteur n'en publie pas d'autre forme, et le repli littéral vaut mieux qu'une
couleur devinée.

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

**Le son ne produit rien, pour cinq causes cumulées.** Corrigé sur la branche
`fix/web-audio-wiring` ; l'état décrit ici est celui de `main` avant elle.

1. **Aucun déclencheur.** `play()` et `playUrl()` n'avaient **aucun appelant**
   dans `src/`. Les six signaux liés au pack étaient morts par construction : le
   manifeste les publiait, rien ne les jouait. Aucun test ne couvrait
   `AudioProvider`, ce qui explique la longévité du défaut.
2. **Aucune ambiance publiée.** Les vues demandent `ambience.map` et
   `ambience.home` ; le manifeste ne déclare que quatre `signature.*` et deux
   `music.*`. La résolution rendait `undefined`, et le silence était
   indistinguable d'une panne.
3. **`available` mesurait le mauvais fait.** Il valait « un manifeste est
   chargé », pas « un fichier est lisible ». Le pack ne publiant que de l'Ogg,
   Safari affichait un réglage sonore actif dans un état où rien ne pouvait
   sortir : l'interface mentait.
4. **`prefers-reduced-motion` coupait l'ambiance sans le dire.** Le bouton
   restait affiché comme actif.
5. La démonstration hors ligne portait **un second bouton son**, purement local,
   branché sur un état sans aucun effet.

Ce qui **n'était pas** en cause : le son coupé par défaut est une décision
délibérée du produit, conservée.

Corrigé sur cette branche : les sélecteurs `body > .site-footer` de
`globals.css` et `platform.css` ne correspondaient à rien — le pied de page est
enfant de `main`, pas de `body` — et n'ont donc jamais masqué quoi que ce soit.
Le masquage passe par un sélecteur descendant dans `shell.css`.

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
| Aucune boucle d'ambiance | Le catalogue CC0 de Kenney n'en publie pas. Aucune source non CC0 n'a été substituée. | Les 5 signaux `ambience.*` restent non liés. 6 signaux sur 11 sont liés au pack, et **tous les six sont désormais déclenchés**. Le manque est annoncé : `ambienceStatus` vaut `missing`, le réglage sonore le dit dans son libellé accessible, et une trace `console.info` nomme le signal demandé. |
| Aucune source MP3 | Le pack Kenney publie de l'Ogg, et transcoder romprait la provenance vérifiable par empreinte. | Sur un navigateur qui refuse l'Ogg — Safari —, aucun signal ne se résout : le réglage sonore est alors **désactivé** et annonce « ce navigateur ne sait lire aucun des formats publiés », au lieu de se laisser activer en vain. |
| Aucune musique longue | Idem : seulement des stingers courts. Les pistes de 48 s par acte restent à produire. | `music.ending` et `music.gameOver` jouent un jingle, pas une piste. |
| Aucune illustration peinte dans le pack | Kenney ne publie pas de 2D compatible avec la direction artistique Diapason. | Le pack ne contient que de l'UI, des icônes, des sfx et des stingers. Aucun décor de scène. |
| Aucun portrait de personnage dans le pack | Idem. | Le seul portrait livré est `public/illustrations/familiar-aster.jpg`, un asset projet, pas un asset du pack. |
| Rotation quotidienne | **Documentée dans la bible d'univers du dépôt `GenEngine`, jamais implémentée ici.** Le mot n'apparaît nulle part dans ce dépôt, ni en code ni en configuration. | Aucune. La capacité n'existe pas et n'est annoncée nulle part dans l'interface. |
| Game over de première classe | Le moteur ne publie que `isEnding` sur un nœud ; aucun drapeau d'échec dans `ScenarioStructureContract` ni `NarrativeTreeContract`. | L'échec est **narratif seulement**. Le champ `outcome` (`accord` / `partielle` / `rupture`) est un type **local à la démonstration** (`src/entities/story/model/story.ts`), jamais présenté comme un contrat serveur. Sur une rupture, l'interface désactive le retour arrière et promeut « Reprendre depuis le début » ; elle ne le supprime pas. |
| Médias de scène et de choix | Le schéma narratif du moteur les refuse : `PUT /scenarios/{id}/draft` répond `200` sur un document intact et `422 invalid_json` sur le même document augmenté d'un `visualUrl` de nœud et d'un `animationCue` de choix. | Le Studio édite et prévisualise, puis nomme cette cause probable quand l'enregistrement échoue. Dépendance `GenEngine`. |

### Les illustrations restent partiellement hors sujet

`public/illustrations/` contenait quatre visuels d'**heroic fantasy** hérités
d'une itération antérieure. Trois demeurent : `world-map.jpg` (îles flottantes
isométriques avec phare, forêt enchantée, ruine gothique, forteresse de lave),
`familiar-aster.jpg` (renard céleste à oreilles de cristal) et
`tutorial-key.jpg`. Ils contredisent la configuration de référence — 2026, notre
monde, IA partout, un apprenti d'école d'ingénieur.

`intro-gateway.jpg` — figure encapuchonnée devant un portail doré, cité elfique —
**a été retiré**. C'était le seul visuel de l'accueil, et il jurait avec un texte
qui parle d'alternance et d'outils de présélection. Il est remplacé par
`diapason-resonance.svg` : une composition **abstraite**, sans lieu ni
personnage — un diapason stylisé, ses ondes concentriques, une trame de points
régulière au centre et dispersée en périphérie. Le motif figure l'objet du jeu
plutôt qu'un décor : une information qui paraît ordonnée. Le fichier est local et
vectoriel ; **aucun hotlink externe**, un lien Unsplash ayant déjà été retiré
deux fois de ce produit.

La copie qui entoure les trois visuels restants suit encore la veine héritée
(« Chaque monde commence par une porte », « une clé », « un familier »). C'est
une production d'assets et une passe de copie, pas du code client.

## Écarts de documentation corrigés le 19 juillet 2026

Ces affirmations figuraient dans les documents et étaient fausses ou périmées.
Elles sont listées pour éviter qu'elles ne reviennent par copie d'un ancien
handoff.

- « 113 tests Vitest » — il y en a **181**, répartis en 16 fichiers.
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

- La sortie sonore **réelle** : personne n'a entendu ces signaux. Le câblage est vérifié par les tests et par la lecture du code ; qu'un son sorte effectivement des haut-parleurs, au bon volume et au bon moment, reste à confirmer à l'oreille sur un navigateur de bureau, son activé depuis la HUD.
- Le comportement sur Safari : le cas « aucun format lisible » est vérifié par un test qui injecte `canPlay` faux, jamais sur un Safari réel.
- Le pack `diapason-core` servi par le backend (`GET /asset-packs/{packId}/files/…`). Les deux copies sont réputées identiques ; seule celle du client est testée.
- Les états de refus de `/library/[versionId]` — 401, `422 content_not_assigned`, 404 — sur une instance Play réelle.
- La sortie sonore d'une instance dont le `branding` publie une police : `--brand-font-story` est appliquée, mais aucune configuration servie n'en déclare encore une différente de la nôtre.

Le catalogue paginé, lui, **a été exercé contre le moteur réel** : `GenEngine` #55
est fusionnée (`ad6293e`) et l'enveloppe est renvoyée. Attention à un piège
d'instance et non de code : le script d'installation Diapason n'est pas
idempotent, et l'avoir rejoué a laissé **20 entrées pour 10 titres distincts**
dans le catalogue local. Les doublons viennent des données, pas de la
pagination du client.

## Ce que le moteur sert et que le client ne consomme toujours pas

Ces capacités sont **publiées et vérifiées par API**, mais aucun écran ne les
lit. Elles sont listées ici pour qu'elles ne soient pas redécouvertes une
troisième fois, et laissées de côté volontairement : chacune est une tranche à
part entière, et les empiler dans une seule PR aurait rendu la revue impossible.

| Capacité | Route | Pourquoi c'est laissé |
|---|---|---|
| Parcours, verrouillage et progression | `GET /me/experience/journeys` (5205) | Demande un écran de parcours qui n'existe pas : déblocage avec le **nom** du parcours bloquant, progression par parcours et par catégorie, parcours par défaut modifiable. La carte n'a aujourd'hui aucune notion de parcours. |
| **202 descripteurs de champs** | `GET /admin/configuration/field-descriptors` (5204) | C'est le plus gros manque restant, et le besoin est explicite : « à chaque fois qu'il y a un champ dans les paramètres ou dans l'administration on doit savoir de quoi il s'agit ». Le composant `Field` n'a **structurellement pas de prop de description** ; il faut la lui ajouter, puis câbler les formulaires du Studio et de l'Administration par chemin de champ. Le motif de rendu existe déjà : `.field-effect` du configurateur de familier. |
| Bloc `finale` | `GET /experience/{frontId}` | Scénario de fin avec conditions. Atteindre la fin **ne verrouille rien** ; il faut donc un écran qui montre la progression vers la fin sans se comporter comme un game over. Les libellés `finale.*` sont déjà publiés dans `language.labels`. |
| Axes de familier étendus | `GET /experience/{frontId}` | Neuf axes catalogués, chacun avec libellé, description d'effet et jeton d'accent. Le configurateur en expose cinq, en dur. La palette d'accents étant désormais projetée en CSS, les jetons d'axe sont enfin rendables. |

## Décisions à préserver

- Backend autoritatif ; aucune règle `GenEngine.Narrative` dans le client.
- Démonstration isolée dans `src/shared/mocks`, jamais utilisée comme repli silencieux, réservée aux visiteurs anonymes.
- Une seule implémentation de disposition du graphe : la structure sans état passe par un adaptateur, pas par une seconde dérivation.
- Échanges réseau centralisés dans `src/shared/api` ; JWT en cookie `HttpOnly` ; URLs backend sans préfixe `NEXT_PUBLIC_`.
- Un écran qui affiche un nombre de récits affiche le `total` du serveur, jamais le nombre d'éléments chargés ; une recherche sur une liste paginée est exécutée par le serveur, jamais sur la page.
- Masquer une action dans l'interface ne remplace jamais l'autorisation serveur.
- Accessibilité clavier, contrastes et `prefers-reduced-motion`.
- Le son est optionnel, désactivé par défaut, et ne porte jamais seul une information. Chaque signal est câblé à un évènement **déjà visible** ; la correspondance vit dans `src/shared/audio/audio-signals.ts`, en fonctions pures et testées.
- Le réglage sonore n'est proposé actif que si un signal au moins se résout vers un fichier lisible par ce navigateur. Un réglage qui ne règle rien est un mensonge de l'interface.
- `prefers-reduced-motion` gouverne l'animation, **pas le son** : le son a son propre réglage explicite, et une préférence de mouvement n'a pas à le contredire en silence.
- Une porte de la carte ouvre toujours une interface réelle ou dit pourquoi elle est vide.
- Une capacité que le moteur n'expose pas est annoncée absente, jamais simulée.
- Un média assigné est toujours auditionnable ou visible dans le Studio même.
- Un repère d'animation inconnu du client n'est pas joué, et l'aperçu le dit.
- Conteneur non-root, en lecture seule et observable par healthcheck.

## Critère de passage de relais réussi

Un nouvel agent doit pouvoir lire `AGENTS.md`, lancer les sept contrôles locaux,
démarrer Compose, et distinguer sans ambiguïté ce qui est livré, ce qui est cassé
et ce qui est délibérément absent — sans dépendre de l'historique de conversation.
